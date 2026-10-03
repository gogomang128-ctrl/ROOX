import { db } from "@/db";
import { messages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { bad, getCurrentUserRow, readJson, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUserRow();
  if (!user) return unauthorized();
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, user.id))
    .orderBy(asc(messages.id))
    .limit(300);
  await db
    .update(messages)
    .set({ readByUser: true })
    .where(and(eq(messages.userId, user.id), eq(messages.sender, "admin")));
  return Response.json({
    messages: rows.map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUserRow();
  if (!user) return unauthorized();
  const b = await readJson(req);
  const body = String(b.body ?? "").trim().slice(0, 1000);
  if (!body) return bad("اكتب رسالة");
  await db
    .insert(messages)
    .values({ userId: user.id, sender: "user", body, readByUser: true });
  return Response.json({ ok: true });
}
