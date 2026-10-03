import { db } from "@/db";
import { orders, users, walletTx } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { bad, isAdmin, readJson, toOrder, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(300);
  return Response.json({ orders: rows.map(toOrder) });
}

export async function DELETE() {
  if (!(await isAdmin())) return unauthorized();

  const deleted = await db.transaction(async (tx) => {
    const deletedOrders = await tx.delete(orders).returning({ id: orders.id });
    const deletedTransactions = await tx.delete(walletTx).returning({ id: walletTx.id });
    return { orders: deletedOrders.length, transactions: deletedTransactions.length };
  });

  return Response.json({ ok: true, deleted });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const id = Number(b.id);
  const status = String(b.status ?? "");
  if (!Number.isInteger(id) || !["pending", "paid", "completed", "cancelled"].includes(status))
    return bad("بيانات غير صالحة");

  const res = await db.transaction(async (tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!o) return { error: "الطلب غير موجود" };
    if (o.status === status) return { ok: true };
    if (o.status === "cancelled") return { error: "لا يمكن تعديل طلب ملغي" };
    if (status === "cancelled" && o.paymentMethod === "wallet") {
      const total = Number(o.total);
      const upd = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${total}` })
        .where(eq(users.id, o.userId))
        .returning({ balance: users.balance });
      if (upd.length) {
        await tx.insert(walletTx).values({
          userId: o.userId,
          type: "refund",
          amount: String(total),
          balanceAfter: upd[0].balance,
          note: `استرجاع - إلغاء فاتورة ${o.invoiceNo}`,
        });
      }
    }
    await tx.update(orders).set({ status }).where(eq(orders.id, id));
    return { ok: true };
  });

  if ("error" in res) return bad(res.error as string);
  return Response.json({ ok: true });
}
