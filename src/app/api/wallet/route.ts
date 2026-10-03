import { db } from "@/db";
import { walletTx } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserRow, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUserRow();
  if (!user) return unauthorized();
  const rows = await db
    .select()
    .from(walletTx)
    .where(eq(walletTx.userId, user.id))
    .orderBy(desc(walletTx.id))
    .limit(50);
  return Response.json({
    balance: Number(user.balance),
    transactions: rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      balanceAfter: Number(r.balanceAfter),
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
