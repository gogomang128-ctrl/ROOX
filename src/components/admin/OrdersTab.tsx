"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { PAYMENT_LABELS, STATUS_COLORS, STATUS_LABELS, buildInvoiceText, fmtDate, money } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useApp } from "../Providers";

export default function OrdersTab({ orders, reload }: { orders: Order[]; reload: () => Promise<void> }) {
  const { toast, settings } = useApp();
  const [filter, setFilter] = useState("all");
  const [resetting, setResetting] = useState(false);
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  async function resetOrdersAndTransactions() {
    if (!confirm("سيتم حذف جميع الطلبات وسجل معاملات المحافظ نهائيًا. أرصدة العملاء لن تتغير. هل تريد المتابعة؟")) return;
    setResetting(true);
    const r = await api("/api/admin/orders", "DELETE");
    if (r.ok) {
      toast(`تم حذف ${r.data.deleted.orders} طلب و${r.data.deleted.transactions} معاملة`);
      await reload();
    } else {
      toast(r.data.error || "فشل حذف الطلبات والمعاملات", "err");
    }
    setResetting(false);
  }

  async function setStatus(o: Order, status: string) {
    if (status === "cancelled" && !confirm(o.paymentMethod === "wallet" ? "سيتم إلغاء الطلب وإرجاع المبلغ لمحفظة العميل. متأكد؟" : "إلغاء الطلب؟")) return;
    const r = await api("/api/admin/orders", "PATCH", { id: o.id, status });
    if (r.ok) toast("تم تحديث الطلب");
    else toast(r.data.error || "فشل", "err");
    await reload();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "paid", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rb-btn !py-1 !px-3 text-sm ${filter === s ? "rb-blue" : "rb-gray"}`}>
              {s === "all" ? "الكل" : STATUS_LABELS[s]} ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
            </button>
          ))}
        </div>
        <button
          onClick={resetOrdersAndTransactions}
          disabled={resetting}
          className="rb-btn rb-red !py-1 text-sm disabled:opacity-50"
          title="حذف الطلبات وسجل المعاملات فقط، دون تغيير أرصدة العملاء"
        >
          {resetting ? "جارٍ الحذف..." : "🗑️ إعادة ضبط الطلبات والمعاملات"}
        </button>
      </div>
      {list.length === 0 && <div className="rb-card p-8 text-center text-zinc-400">لا توجد طلبات</div>}
      {list.map((o) => (
        <div key={o.id} className="rb-card p-3 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Link href={`/invoice/${o.invoiceNo}`} target="_blank" className="font-black text-[#6c8cff]" dir="ltr">
                {o.invoiceNo}
              </Link>
              <div className="text-xs text-zinc-400">{fmtDate(o.createdAt)}</div>
            </div>
            <span className={`text-xs font-black px-2 py-1 rounded ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
            <span className="font-black text-[#2ee06f]">{money(o.total)}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>👤 العميل: <b>{o.username}</b> <span className="text-zinc-500">(ID {o.publicId})</span></div>
            <div>🎮 روبلوكس: <b dir="ltr">{o.robloxUsername}</b></div>
            <div>💳 الدفع: <b>{PAYMENT_LABELS[o.paymentMethod]}</b></div>
            {o.paymentRef && <div>🔖 مرجع: <b dir="ltr">{o.paymentRef}</b></div>}
            <div className="sm:col-span-2 text-zinc-300">🛍 {o.items.map((i) => `${i.name} ×${i.qty}`).join("، ")}</div>
            {o.note && <div className="sm:col-span-2 text-zinc-400">📝 {o.note}</div>}
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            {o.status === "pending" && (
              <button className="rb-btn rb-blue !py-1 text-sm" onClick={() => setStatus(o, "paid")}>✔ تأكيد الدفع</button>
            )}
            {(o.status === "pending" || o.status === "paid") && (
              <button className="rb-btn rb-green !py-1 text-sm" onClick={() => setStatus(o, "completed")}>🎁 تم التسليم</button>
            )}
            {o.status !== "cancelled" && o.status !== "completed" && (
              <button className="rb-btn rb-red !py-1 text-sm" onClick={() => setStatus(o, "cancelled")}>✖ إلغاء</button>
            )}
            <a
              className="rb-btn rb-gray !py-1 text-sm"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(buildInvoiceText(o, settings.siteName))}`}
            >
              📲 واتساب
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
