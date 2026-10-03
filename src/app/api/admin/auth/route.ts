import crypto from "node:crypto";
import {
  ADMIN_PASSWORD,
  bad,
  clearAdminCookie,
  isAdmin,
  readJson,
  setAdminCookie,
} from "@/lib/server";

export const dynamic = "force-dynamic";

const h = (s: string) => crypto.createHash("sha256").update(s).digest();

export async function GET() {
  return Response.json({ admin: await isAdmin() });
}

export async function POST(req: Request) {
  const b = await readJson(req);
  const pw = String(b.password ?? "");
  if (!crypto.timingSafeEqual(h(pw), h(ADMIN_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 700));
    return bad("كلمة مرور الأدمن غير صحيحة", 401);
  }
  await setAdminCookie();
  return Response.json({ admin: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}
