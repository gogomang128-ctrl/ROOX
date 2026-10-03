import { db } from "@/db";
import { products } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { bad, isAdmin, readJson, round2, toProduct, unauthorized } from "@/lib/server";

export const dynamic = "force-dynamic";

function parse(b: Record<string, unknown>) {
  const name = String(b.name ?? "").trim().slice(0, 100);
  const price = round2(Number(b.price));
  if (!name) return { error: "اكتب اسم المنتج" } as const;
  if (!Number.isFinite(price) || price < 0) return { error: "اكتب سعراً صحيحاً" } as const;
  const old = b.oldPrice === null || b.oldPrice === "" || b.oldPrice === undefined ? null : round2(Number(b.oldPrice));
  const category = ["robux", "coins", "other"].includes(String(b.category)) ? String(b.category) : "robux";
  return {
    value: {
      name,
      description: String(b.description ?? "").trim().slice(0, 300),
      category,
      amount: Math.max(0, Math.floor(Number(b.amount) || 0)),
      price: String(price),
      oldPrice: old !== null && Number.isFinite(old) ? String(old) : null,
      imageUrl: String(b.imageUrl ?? "").slice(0, 300),
      active: b.active === undefined ? true : Boolean(b.active),
      sortOrder: Math.floor(Number(b.sortOrder) || 0),
    },
  } as const;
}

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
  return Response.json({ products: rows.map(toProduct) });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const p = parse(await readJson(req));
  if (!p.value) return bad(p.error ?? "بيانات غير صالحة");
  const [row] = await db.insert(products).values(p.value).returning();
  return Response.json({ product: toProduct(row) });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const b = await readJson(req);
  const id = Number(b.id);
  if (!Number.isInteger(id)) return bad("معرف غير صالح");
  const p = parse(b);
  if (!p.value) return bad(p.error ?? "بيانات غير صالحة");
  const [row] = await db.update(products).set(p.value).where(eq(products.id, id)).returning();
  if (!row) return bad("المنتج غير موجود", 404);
  return Response.json({ product: toProduct(row) });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("معرف غير صالح");
  await db.delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}
