import { db } from "@/db";
import { images } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n)) return new Response("Not found", { status: 404 });
  const [img] = await db.select().from(images).where(eq(images.id, n));
  if (!img) return new Response("Not found", { status: 404 });
  const buf = Buffer.from(img.data, "base64");
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
