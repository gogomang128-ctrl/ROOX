import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  bad,
  readJson,
  setUserCookie,
  toPublicUser,
  usernameKey,
  verifyPassword,
} from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson(req);
  const username = String(b.username ?? "");
  const password = String(b.password ?? "");
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.usernameKey, usernameKey(username)));
  if (!u || !verifyPassword(password, u.passwordHash)) {
    await new Promise((r) => setTimeout(r, 400));
    return bad("اسم المستخدم أو كلمة المرور غير صحيحة", 401);
  }
  if (u.banned) return bad("هذا الحساب موقوف، تواصل مع الإدارة", 403);
  await setUserCookie(u.id);
  return Response.json({ user: toPublicUser(u) });
}
