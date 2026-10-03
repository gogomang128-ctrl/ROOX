import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { bad, isAdmin, readJson, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const userIdParam = new URL(req.url).searchParams.get("userId");

  if (userIdParam) {
    const uid = Number(userIdParam);
    if (!Number.isInteger(uid)) return bad("معرف غير صالح");
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, uid))
      .orderBy(asc(messages.id))
      .limit(500);
    await db
      .update(messages)
      .set({ readByAdmin: true })
      .where(and(eq(messages.userId, uid), eq(messages.sender, "user")));
    return Response.json({
      messages: rows.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }

  const r = await db.execute(sql`
    select u.id as id, u.username as username, u.public_id as public_id,
      max(m.created_at) as last_at,
      count(*) filter (where m.sender = 'user' and not m.read_by_admin)::int as unread,
      (select body from messages m2 where m2.user_id = u.id order by m2.id desc limit 1) as last_body
    from users u join messages m on m.user_id = u.id
    group by u.id order by max(m.created_at) desc
  `);
  const threads = (r.rows as Record<string, unknown>[]).map((x) => ({
    id: Number(x.id),
    username: String(x.username),
    publicId: String(x.public_id),
    lastBody: String(x.last_body ?? ""),
    lastAt: new Date(x.last_at as string).toISOString(),
    unread: Number(x.unread),
  }));
  return Response.json({ threads });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const uid = Number(b.userId);
  const body = String(b.body ?? "").trim().slice(0, 1000);
  if (!Number.isInteger(uid)) return bad("معرف غير صالح");
  if (!body) return bad("اكتب رسالة");
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, uid));
  if (!u) return bad("العميل غير موجود", 404);
  await db
    .insert(messages)
    .values({ userId: uid, sender: "admin", body, readByAdmin: true });
  return Response.json({ ok: true });
}
