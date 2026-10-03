import { db } from "@/db";
import { images } from "@/db/schema";
import { bad, isAdmin, readJson, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const data = String(b.data ?? "");
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(data);
  if (!m) return bad("صيغة الصورة غير مدعومة");
  if (m[2].length > 4_000_000) return bad("حجم الصورة كبير جداً");
  const [img] = await db.insert(images).values({ mime: m[1], data: m[2] }).returning();
  return Response.json({ url: `/api/images/${img.id}` });
}
