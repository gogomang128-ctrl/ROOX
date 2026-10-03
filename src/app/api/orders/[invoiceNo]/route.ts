import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bad, getCurrentUserRow, isAdmin, toOrder, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ invoiceNo: string }> }) {
  const { invoiceNo } = await ctx.params;
  const [o] = await db.select().from(orders).where(eq(orders.invoiceNo, invoiceNo));
  if (!o) return bad("الفاتورة غير موجودة", 404);
  if (!(await isAdmin())) {
    const user = await getCurrentUserRow();
    if (!user) return unauthorized();
    if (user.id !== o.userId) return bad("غير مسموح", 403);
  }
  return Response.json({ order: toOrder(o) });
}
