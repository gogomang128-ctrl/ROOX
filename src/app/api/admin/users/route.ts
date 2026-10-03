import { db } from "@/db";
import { messages, users, walletTx } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  USERNAME_RE,
  bad,
  genPublicId,
  hashPassword,
  isAdmin,
  readJson,
  unauthorized,
  usernameKey,
} from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const rows = await db.select().from(users).orderBy(desc(users.id));
  return Response.json({
    users: rows.map((u) => ({
      id: u.id,
      publicId: u.publicId,
      username: u.username,
      balance: Number(u.balance),
      banned: u.banned,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const username = String(b.username ?? "").trim();
  const password = String(b.password ?? "");
  if (!USERNAME_RE.test(username)) return bad("اسم المستخدم غير صالح (3-20 حرفاً)");
  if (password.length < 8) return bad("كلمة المرور يجب ألا تقل عن 8 أحرف");
  const key = usernameKey(username);
  const ex = await db.select({ id: users.id }).from(users).where(eq(users.usernameKey, key));
  if (ex.length) return bad("اسم المستخدم مستخدم بالفعل");
  const [u] = await db
    .insert(users)
    .values({
      username,
      usernameKey: key,
      passwordHash: hashPassword(password),
      publicId: await genPublicId(),
    })
    .returning();
  return Response.json({ ok: true, id: u.id, publicId: u.publicId });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const id = Number(b.id);
  if (!Number.isInteger(id)) return bad("معرف غير صالح");
  const set: Partial<typeof users.$inferInsert> = {};
  if (typeof b.password === "string" && b.password) {
    if (b.password.length < 8) return bad("كلمة المرور يجب ألا تقل عن 8 أحرف");
    set.passwordHash = hashPassword(b.password);
  }
  if (typeof b.banned === "boolean") set.banned = b.banned;
  if (!Object.keys(set).length) return bad("لا يوجد تعديل");
  await db.update(users).set(set).where(eq(users.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("معرف غير صالح");
  await db.delete(messages).where(eq(messages.userId, id));
  await db.delete(walletTx).where(eq(walletTx.userId, id));
  await db.delete(users).where(eq(users.id, id));
  return Response.json({ ok: true });
}
