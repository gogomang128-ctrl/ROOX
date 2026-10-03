import { db } from "@/db";
import { orders, products, users, walletTx } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  autoSendWhatsApp,
  bad,
  getCurrentUserRow,
  getSettings,
  readJson,
  round2,
  toOrder,
  unauthorized,
} from "@/lib/server";
import type { OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const METHODS = ["wallet", "instapay", "vodafone", "orange"];

export async function GET() {
  const user = await getCurrentUserRow();
  if (!user) return unauthorized();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.id))
    .limit(100);
  return Response.json({ orders: rows.map(toOrder) });
}

export async function POST(req: Request) {
  const user = await getCurrentUserRow();
  if (!user) return unauthorized();
  const b = await readJson(req);

  const rawItems = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : [];
  const qtyMap = new Map<number, number>();
  for (const it of rawItems) {
    const id = Number(it.productId);
    const qty = Math.min(50, Math.max(1, Math.floor(Number(it.qty) || 1)));
    if (Number.isInteger(id)) qtyMap.set(id, Math.min(50, (qtyMap.get(id) ?? 0) + qty));
  }
  if (!qtyMap.size) return bad("السلة فارغة");

  const method = String(b.paymentMethod ?? "");
  if (!METHODS.includes(method)) return bad("اختر طريقة دفع صحيحة");
  const robloxUsername = String(b.robloxUsername ?? "").trim().slice(0, 40);
  if (robloxUsername.length < 2) return bad("اكتب اسم حسابك في روبلوكس");
  const paymentRef = String(b.paymentRef ?? "").trim().slice(0, 100);
  if (method !== "wallet" && paymentRef.length < 3)
    return bad("اكتب رقم الهاتف/الحساب الذي حولت منه أو رقم العملية");
  const note = String(b.note ?? "").trim().slice(0, 300);

  const rows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, [...qtyMap.keys()]), eq(products.active, true)));
  if (rows.length !== qtyMap.size) return bad("بعض المنتجات لم تعد متاحة، حدّث السلة");

  const items: OrderItem[] = rows.map((p) => ({
    productId: p.id,
    name: p.name,
    qty: qtyMap.get(p.id)!,
    price: Number(p.price),
    amount: p.amount,
  }));
  const total = round2(items.reduce((s, i) => s + i.price * i.qty, 0));

  let invoiceNo = "";
  for (let i = 0; i < 10; i++) {
    const c = `RX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const ex = await db.select({ id: orders.id }).from(orders).where(eq(orders.invoiceNo, c));
    if (!ex.length) {
      invoiceNo = c;
      break;
    }
  }
  if (!invoiceNo) return bad("تعذر إنشاء رقم فاتورة، حاول مجدداً", 500);

  try {
    const row = await db.transaction(async (tx) => {
      let status = "pending";
      if (method === "wallet") {
        const upd = await tx
          .update(users)
          .set({ balance: sql`${users.balance} - ${total}` })
          .where(and(eq(users.id, user.id), sql`${users.balance} >= ${total}`))
          .returning({ balance: users.balance });
        if (!upd.length) throw new Error("INSUFFICIENT");
        await tx.insert(walletTx).values({
          userId: user.id,
          type: "purchase",
          amount: String(-total),
          balanceAfter: upd[0].balance,
          note: `شراء - فاتورة ${invoiceNo}`,
        });
        status = "paid";
      }
      const [o] = await tx
        .insert(orders)
        .values({
          invoiceNo,
          userId: user.id,
          username: user.username,
          publicId: user.publicId,
          robloxUsername,
          items,
          total: String(total),
          paymentMethod: method,
          paymentRef,
          note,
          status,
        })
        .returning();
      return o;
    });
    const order = toOrder(row);
    const settings = await getSettings();
    // fire-and-forget automatic WhatsApp (works when CALLMEBOT_APIKEY is configured)
    void autoSendWhatsApp(order, settings);
    return Response.json({ order });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") return bad("رصيد المحفظة غير كافٍ");
    return bad("حدث خطأ أثناء إنشاء الطلب", 500);
  }
}
