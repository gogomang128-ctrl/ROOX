import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  USERNAME_RE,
  bad,
  genPublicId,
  hashPassword,
  readJson,
  setUserCookie,
  toPublicUser,
  usernameKey,
} from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson(req);
  const username = String(b.username ?? "").trim();
  const password = String(b.password ?? "");
  if (!USERNAME_RE.test(username))
    return bad("اسم المستخدم يجب أن يكون من 3 إلى 20 حرفاً (حروف أو أرقام أو _ . -)");
  if (password.length < 8) return bad("كلمة المرور يجب ألا تقل عن 8 أحرف");
  const key = usernameKey(username);
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.usernameKey, key));
  if (exists.length) return bad("اسم المستخدم مستخدم بالفعل");
  const [u] = await db
    .insert(users)
    .values({
      username,
      usernameKey: key,
      passwordHash: hashPassword(password),
      publicId: await genPublicId(),
    })
    .returning();
  await setUserCookie(u.id);
  return Response.json({ user: toPublicUser(u) });
}
