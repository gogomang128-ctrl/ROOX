import { db } from "@/db";
import { users, walletTx } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { bad, isAdmin, readJson, round2, unauthorized, usernameKey } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const rows = await db
    .select({
      id: walletTx.id,
      username: users.username,
      type: walletTx.type,
      amount: walletTx.amount,
      balanceAfter: walletTx.balanceAfter,
      note: walletTx.note,
      createdAt: walletTx.createdAt,
    })
    .from(walletTx)
    .innerJoin(users, eq(users.id, walletTx.userId))
    .orderBy(desc(walletTx.id))
    .limit(100);
  return Response.json({
    transactions: rows.map((r) => ({
      id: r.id,
      username: r.username,
      type: r.type,
      amount: Number(r.amount),
      balanceAfter: Number(r.balanceAfter),
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const name = String(b.username ?? "").trim();
  const action = String(b.action ?? "");
  const amount = round2(Number(b.amount));
  const note = String(b.note ?? "").trim().slice(0, 200);
  if (!name) return bad("اكتب اسم العميل");
  if (!["add", "deduct"].includes(action)) return bad("عملية غير صالحة");
  if (!Number.isFinite(amount) || amount <= 0) return bad("اكتب مبلغاً صحيحاً أكبر من صفر");

  const [u] = await db.select().from(users).where(eq(users.usernameKey, usernameKey(name)));
  if (!u) return bad("لا يوجد عميل بهذا الاسم", 404);

  const result = await db.transaction(async (tx) => {
    const upd =
      action === "add"
        ? await tx
            .update(users)
            .set({ balance: sql`${users.balance} + ${amount}` })
            .where(eq(users.id, u.id))
            .returning({ balance: users.balance })
        : await tx
            .update(users)
            .set({ balance: sql`${users.balance} - ${amount}` })
            .where(and(eq(users.id, u.id), sql`${users.balance} >= ${amount}`))
            .returning({ balance: users.balance });
    if (!upd.length) return null;
    await tx.insert(walletTx).values({
      userId: u.id,
      type: action === "add" ? "credit" : "debit",
      amount: String(action === "add" ? amount : -amount),
      balanceAfter: upd[0].balance,
      note: note || (action === "add" ? "إضافة رصيد من الإدارة" : "خصم رصيد من الإدارة"),
    });
    return Number(upd[0].balance);
  });

  if (result === null) return bad("رصيد العميل أقل من المبلغ المطلوب خصمه");
  return Response.json({ ok: true, username: u.username, balance: result });
}
