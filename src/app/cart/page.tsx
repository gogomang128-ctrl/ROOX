"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { api } from "@/lib/api";
import { PAYMENT_LABELS, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { RobuxIcon } from "@/components/Art";

export default function CartPage() {
  const { cart, setQty, removeFromCart, clearCart, user, settings, toast, refreshUser } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [method, setMethod] = useState("");
  const [roblox, setRoblox] = useState("");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/api/products").then((r) => setProducts(r.ok ? r.data.products : []));
  }, []);

  const lines = useMemo(() => {
    if (!products) return [];
    return cart
      .map((l) => ({ p: products.find((x) => x.id === l.id), qty: l.qty }))
      .filter((l): l is { p: Product; qty: number } => !!l.p);
  }, [cart, products]);

  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const walletOk = !!user && user.balance >= total;

  const numbers: Record<string, { label: string; value: string }> = {
    instapay: { label: "حساب/رقم انستا باي", value: settings.instapay },
    vodafone: { label: "رقم فودافون كاش", value: settings.vodafone },
    orange: { label: "رقم أورنج كاش", value: settings.orange },
  };

  async function checkout() {
    setErr("");
    if (!method) return setErr("اختر طريقة الدفع");
    setBusy(true);
    const r = await api("/api/orders", "POST", {
      items: lines.map((l) => ({ productId: l.p.id, qty: l.qty })),
      paymentMethod: method,
      robloxUsername: roblox,
      paymentRef: ref,
      note,
    });
    setBusy(false);
    if (!r.ok) {
      if (r.status === 401) return router.push("/login?next=/cart");
      return setErr(r.data.error || "حدث خطأ");
    }
    clearCart();
    refreshUser();
    toast("تم إنشاء الفاتورة بنجاح 🎉");
    router.push(`/invoice/${r.data.order.invoiceNo}?new=1`);
  }

  if (products && lines.length === 0)
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-3">🛒</div>
        <h1 className="text-2xl font-black">سلتك فارغة</h1>
        <Link href="/" className="rb-btn rb-green mt-5 inline-flex">
          ▶ تصفح الباقات
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-3 py-6 grid lg:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <h1 className="text-2xl font-black">🛒 سلة المشتريات</h1>
        {!products && <div className="rb-card p-6 text-zinc-400">جاري التحميل...</div>}
        {lines.map(({ p, qty }) => (
          <div key={p.id} className="rb-card p-3 flex items-center gap-3">
            <div className="w-16 h-16 rounded-md bg-[#1d1f22] grid place-items-center overflow-hidden shrink-0">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <RobuxIcon className="w-9 h-9 text-[#f7b500]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black truncate">{p.name}</div>
              <div className="text-[#2ee06f] font-bold text-sm">{money(p.price)}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="rb-btn rb-gray !px-2.5 !py-1" onClick={() => setQty(p.id, qty - 1)}>
                −
              </button>
              <span className="w-8 text-center font-black">{qty}</span>
              <button className="rb-btn rb-gray !px-2.5 !py-1" onClick={() => setQty(p.id, qty + 1)}>
                +
              </button>
            </div>
            <button className="rb-btn rb-red !px-2.5 !py-1" onClick={() => removeFromCart(p.id)} aria-label="حذف">
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="rb-card p-4 space-y-4 h-fit lg:sticky lg:top-20">
        <div className="flex justify-between items-center text-lg font-black">
          <span>الإجمالي</span>
          <span className="text-[#2ee06f]">{money(total)}</span>
        </div>

        {!user ? (
          <div className="text-center space-y-2">
            <p className="text-sm text-zinc-300">سجّل الدخول لإتمام الطلب</p>
            <Link href="/login?next=/cart" className="rb-btn rb-blue w-full">
              تسجيل الدخول
            </Link>
          </div>
        ) : (
          <>
            <div className="text-xs text-zinc-400">
              الحساب: <b className="text-white">{user.username}</b> (ID: {user.publicId})
            </div>
            <div>
              <label className="rb-label">اسم حسابك في روبلوكس *</label>
              <input className="rb-input" value={roblox} onChange={(e) => setRoblox(e.target.value)} dir="ltr" placeholder="Roblox username" />
            </div>

            <div>
              <label className="rb-label">طريقة الدفع *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["wallet", "instapay", "vodafone", "orange"] as const).map((m) => {
                  const disabled = m === "wallet" && !walletOk;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      onClick={() => setMethod(m)}
                      className={`rb-btn !flex-col !gap-0 text-sm ${
                        method === m ? "rb-blue ring-2 ring-white" : "rb-gray"
                      }`}
                    >
                      <span>{m === "wallet" ? "👛" : m === "instapay" ? "🏦" : m === "vodafone" ? "🔴" : "🟠"}</span>
                      <span>{PAYMENT_LABELS[m]}</span>
                      {m === "wallet" && <span className="text-[10px] opacity-80">{money(user.balance)}</span>}
                    </button>
                  );
                })}
              </div>
              {method === "wallet" && walletOk && (
                <p className="text-xs text-emerald-400 mt-2">سيتم الخصم فوراً من رصيد محفظتك.</p>
              )}
              {!walletOk && <p className="text-xs text-zinc-500 mt-2">رصيد المحفظة غير كافٍ — الشحن عن طريق الإدارة فقط.</p>}
            </div>

            {numbers[method] && (
              <div className="bg-[#101113] border-2 border-dashed border-[#335fff] rounded-lg p-3 text-sm space-y-2 pop">
                <p>
                  حوّل <b className="text-[#2ee06f]">{money(total)}</b> إلى {numbers[method].label}:
                </p>
                <div className="flex items-center gap-2">
                  <code dir="ltr" className="flex-1 bg-black/50 rounded px-2 py-1.5 font-black text-lg text-center">
                    {numbers[method].value}
                  </code>
                  <button
                    className="rb-btn rb-gray !py-1.5 text-xs"
                    onClick={() => {
                      navigator.clipboard?.writeText(numbers[method].value);
                      toast("تم النسخ");
                    }}
                  >
                    نسخ
                  </button>
                </div>
                <div>
                  <label className="rb-label">الرقم/الحساب الذي حوّلت منه أو رقم العملية *</label>
                  <input className="rb-input" value={ref} onChange={(e) => setRef(e.target.value)} dir="ltr" />
                </div>
              </div>
            )}

            <div>
              <label className="rb-label">ملاحظات (اختياري)</label>
              <input className="rb-input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {err && <p className="text-red-400 text-sm font-bold">{err}</p>}
            <button className="rb-btn rb-green w-full !py-3 !text-lg" disabled={busy || !lines.length} onClick={checkout}>
              {busy ? "جاري إنشاء الفاتورة..." : "✅ إتمام الطلب وإصدار الفاتورة"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
