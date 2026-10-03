import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, orders, products, siteSettings } from "@/db/schema";
import {
  DEFAULT_SETTINGS,
  type Order,
  type OrderItem,
  type Product,
  type PublicUser,
  type SiteSettings,
} from "./types";
import { buildInvoiceText } from "./format";

const isProduction = process.env.NODE_ENV === "production";
const SECRET = process.env.SESSION_SECRET || (isProduction ? "" : "roox-store-local-development-secret");
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? "" : "01147497465");

if (isProduction && SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters in production");
}
if (isProduction && !ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD is required in production");
}

/* ---------- passwords & tokens ---------- */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${h}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const t = crypto.scryptSync(pw, salt, 64);
  const hb = Buffer.from(h, "hex");
  return hb.length === t.length && crypto.timingSafeEqual(hb, t);
}

function sign(v: string): string {
  return crypto.createHmac("sha256", SECRET).update(v).digest("hex");
}

function makeToken(kind: string, id: string, days: number): string {
  const exp = Date.now() + days * 864e5;
  const body = `${kind}.${id}.${exp}`;
  return `${body}.${sign(body)}`;
}

function readToken(token: string | undefined, kind: string): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [k, id, exp, sig] = parts;
  const expected = sign(`${k}.${id}.${exp}`);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (k !== kind || Number(exp) < Date.now()) return null;
  return id;
}

const cookieOpts = (days: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: days * 86400,
});

export async function setUserCookie(userId: number) {
  (await cookies()).set("rx_user", makeToken("u", String(userId), 30), cookieOpts(30));
}
export async function clearUserCookie() {
  (await cookies()).set("rx_user", "", { ...cookieOpts(0), maxAge: 0 });
}
export async function setAdminCookie() {
  (await cookies()).set("rx_admin", makeToken("a", "admin", 7), cookieOpts(7));
}
export async function clearAdminCookie() {
  (await cookies()).set("rx_admin", "", { ...cookieOpts(0), maxAge: 0 });
}

export async function isAdmin(): Promise<boolean> {
  const t = (await cookies()).get("rx_admin")?.value;
  return readToken(t, "a") === "admin";
}

export type UserRow = typeof users.$inferSelect;

export async function getCurrentUserRow(): Promise<UserRow | null> {
  const t = (await cookies()).get("rx_user")?.value;
  const id = readToken(t, "u");
  if (!id) return null;
  const [u] = await db.select().from(users).where(eq(users.id, Number(id)));
  if (!u || u.banned) return null;
  return u;
}

export function toPublicUser(u: UserRow): PublicUser {
  return { id: u.id, publicId: u.publicId, username: u.username, balance: Number(u.balance) };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const u = await getCurrentUserRow();
  return u ? toPublicUser(u) : null;
}

/* ---------- helpers ---------- */
export const round2 = (n: number) => Math.round(n * 100) / 100;

export function unauthorized() {
  return Response.json({ error: "غير مصرح" }, { status: 401 });
}
export function bad(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/* ---------- settings ---------- */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(siteSettings);
  const out: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  }
  return out;
}

export async function saveSettings(input: Record<string, unknown>) {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (typeof input[key] === "string") {
      const value = (input[key] as string).slice(0, 500);
      await db
        .insert(siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
    }
  }
}

/* ---------- products ---------- */
export function toProduct(r: typeof products.$inferSelect): Product {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    amount: r.amount,
    price: Number(r.price),
    oldPrice: r.oldPrice === null ? null : Number(r.oldPrice),
    imageUrl: r.imageUrl,
    active: r.active,
    sortOrder: r.sortOrder,
  };
}

async function ensureSeed() {
  const pk = [
    [80, 50],
    [400, 250],
    [800, 480],
    [1700, 950],
    [4500, 2400],
    [10000, 5200],
  ];
  await db.transaction(async (tx) => {
    const r = await tx
      .insert(siteSettings)
      .values({ key: "seeded", value: "1" })
      .onConflictDoNothing()
      .returning();
    if (!r.length) return;
    await tx.insert(products).values(
      pk.map(([amount, price], i) => ({
        name: `${amount} روبكس`,
        description: `شحن ${amount} روبكس على حسابك في روبلوكس`,
        category: "robux",
        amount,
        price: String(price),
        sortOrder: i,
      })),
    );
  });
}

export async function getActiveProducts(): Promise<Product[]> {
  await ensureSeed();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.sortOrder, products.id);
  return rows.map(toProduct);
}

/* ---------- orders ---------- */
export function toOrder(r: typeof orders.$inferSelect): Order {
  return {
    id: r.id,
    invoiceNo: r.invoiceNo,
    userId: r.userId,
    username: r.username,
    publicId: r.publicId,
    robloxUsername: r.robloxUsername,
    items: r.items as OrderItem[],
    total: Number(r.total),
    paymentMethod: r.paymentMethod,
    paymentRef: r.paymentRef,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Optional fully-automatic WhatsApp push through CallMeBot (needs CALLMEBOT_APIKEY env). */
export async function autoSendWhatsApp(order: Order, settings: SiteSettings): Promise<boolean> {
  const key = process.env.CALLMEBOT_APIKEY;
  if (!key) return false;
  try {
    const text = buildInvoiceText(order, settings.siteName);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      settings.whatsapp.replace(/\D/g, ""),
    )}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function genPublicId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const r = await db.select({ id: users.id }).from(users).where(eq(users.publicId, id));
    if (!r.length) return id;
  }
  return String(Date.now()).slice(-8);
}

export const USERNAME_RE = /^[\p{L}\p{N}_.-]{3,20}$/u;
export const usernameKey = (u: string) => u.trim().toLowerCase();

export { sql };
