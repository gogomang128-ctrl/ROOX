"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/Providers";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/hooks";
import { PAYMENT_LABELS, STATUS_COLORS, STATUS_LABELS, fmtDate, money } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[] | null>(null);

  usePoll(
    async () => {
      const r = await api("/api/orders");
      if (r.ok) setOrders(r.data.orders);
    },
    10000,
    !!user,
  );

  if (!user)
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <div className="text-5xl">📦</div>
        <h1 className="text-2xl font-black">طلباتي</h1>
        <Link href="/login?next=/orders" className="rb-btn rb-blue">
          تسجيل الدخول
        </Link>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-3 py-6 space-y-3">
      <h1 className="text-2xl font-black">📦 طلباتي</h1>
      {orders === null && <div className="rb-card p-6 text-zinc-400">جاري التحميل...</div>}
      {orders?.length === 0 && (
        <div className="rb-card p-8 text-center text-zinc-400">
          لا توجد طلبات بعد.
          <div className="mt-3">
            <Link href="/" className="rb-btn rb-green">
              ▶ تسوّق الآن
            </Link>
          </div>
        </div>
      )}
      {orders?.map((o) => (
        <Link key={o.id} href={`/invoice/${o.invoiceNo}`} className="rb-card p-3 flex items-center gap-3 hover:border-[#335fff] transition">
          <div className="flex-1 min-w-0">
            <div className="font-black" dir="ltr" style={{ textAlign: "start" }}>
              {o.invoiceNo}
            </div>
            <div className="text-xs text-zinc-400 truncate">
              {o.items.map((i) => `${i.name} ×${i.qty}`).join("، ")}
            </div>
            <div className="text-[11px] text-zinc-500">
              {fmtDate(o.createdAt)} • {PAYMENT_LABELS[o.paymentMethod]}
            </div>
          </div>
          <div className="text-end space-y-1">
            <div className="font-black text-[#2ee06f]">{money(o.total)}</div>
            <span className={`text-[11px] font-black px-2 py-0.5 rounded ${STATUS_COLORS[o.status]}`}>
              {STATUS_LABELS[o.status]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
