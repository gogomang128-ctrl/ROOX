"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Providers";
import { LogoMark } from "@/components/Art";
import { api } from "@/lib/api";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  buildInvoiceText,
  fmtDate,
  money,
  whatsappUrl,
} from "@/lib/format";
import type { Order } from "@/lib/types";

const STAMP: Record<string, string> = {
  pending: "text-amber-500",
  paid: "text-sky-600",
  completed: "text-emerald-600",
  cancelled: "text-red-600",
};

export default function InvoicePage({ params }: { params: Promise<{ invoiceNo: string }> }) {
  const { invoiceNo } = use(params);
  const { settings } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  const opened = useRef(false);

  useEffect(() => {
    api(`/api/orders/${invoiceNo}`).then((r) => {
      if (r.ok) setOrder(r.data.order);
      else setErr(r.status === 401 ? "login" : r.data.error || "تعذر تحميل الفاتورة");
    });
  }, [invoiceNo]);

  const wa = order ? whatsappUrl(settings.whatsapp, buildInvoiceText(order, settings.siteName)) : "#";

  // right after checkout, open WhatsApp with the invoice prefilled for the store number
  useEffect(() => {
    if (!order || opened.current) return;
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      opened.current = true;
      window.open(wa, "_blank");
    }
  }, [order, wa]);

  if (err === "login")
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <p>سجّل الدخول لعرض الفاتورة</p>
        <Link href={`/login?next=/invoice/${invoiceNo}`} className="rb-btn rb-blue">
          تسجيل الدخول
        </Link>
      </div>
    );
  if (err) return <div className="p-16 text-center text-red-400 font-bold">{err}</div>;
  if (!order) return <div className="p-16 text-center text-zinc-400">جاري تحميل الفاتورة...</div>;

  return (
    <div className="max-w-md mx-auto px-3 py-6 space-y-4">
      <div className="invoice-paper">
        {/* header */}
        <div className="bg-[#335fff] text-white p-5 flex items-center gap-3">
          <LogoMark className="w-12 h-12" />
          <div className="flex-1">
            <div className="text-2xl font-black tracking-wide">{settings.siteName}</div>
            <div className="text-xs opacity-80">فاتورة شراء رسمية</div>
          </div>
          <div className={`stamp bg-white ${STAMP[order.status]} text-sm`}>{STATUS_LABELS[order.status]}</div>
        </div>
        <div className="h-3 bg-[repeating-linear-gradient(90deg,#f7b500_0_14px,#1b1d21_14px_28px)]" />

        <div className="p-5 space-y-4">
          <div className="text-center">
            <div className="text-xs text-zinc-500 font-bold">رقم الفاتورة</div>
            <div className="text-3xl font-black tracking-widest text-[#335fff]" dir="ltr">
              {order.invoiceNo}
            </div>
            <div className="text-xs text-zinc-500">{fmtDate(order.createdAt)}</div>
          </div>

          <div className="dash" />

          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-zinc-500">اسم المستخدم</dt>
              <dd className="font-black">{order.username}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">رقم التعريف (ID)</dt>
              <dd className="font-black" dir="ltr" style={{ textAlign: "start" }}>
                {order.publicId}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">حساب روبلوكس</dt>
              <dd className="font-black" dir="ltr" style={{ textAlign: "start" }}>
                {order.robloxUsername}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">طريقة الدفع</dt>
              <dd className="font-black">{PAYMENT_LABELS[order.paymentMethod]}</dd>
            </div>
            {order.paymentRef && (
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">مرجع التحويل</dt>
                <dd className="font-bold" dir="ltr" style={{ textAlign: "start" }}>
                  {order.paymentRef}
                </dd>
              </div>
            )}
          </dl>

          <div className="dash" />

          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500">
                <th className="text-start font-bold pb-1">المنتج</th>
                <th className="font-bold pb-1">الكمية</th>
                <th className="text-end font-bold pb-1">السعر</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.productId} className="border-t border-zinc-100">
                  <td className="py-1.5 font-bold">{i.name}</td>
                  <td className="text-center">{i.qty}</td>
                  <td className="text-end font-bold">{money(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-lg bg-[#17181a] text-white p-4 flex items-center justify-between">
            <span className="font-bold">الإجمالي</span>
            <span className="text-2xl font-black text-[#2ee06f]">{money(order.total)}</span>
          </div>

          {order.note && <p className="text-xs text-zinc-500">ملاحظة: {order.note}</p>}

          <div className="barcode rounded" />
          <p className="text-center text-[11px] text-zinc-400">شكراً لثقتك في {settings.siteName} 💙</p>
        </div>
      </div>

      <div className="no-print grid grid-cols-2 gap-2">
        <a href={wa} target="_blank" rel="noreferrer" className="rb-btn rb-green col-span-2 !py-3">
          📲 إرسال الفاتورة عبر واتساب
        </a>
        <button onClick={() => window.print()} className="rb-btn rb-gray">
          🖨 طباعة / PDF
        </button>
        <Link href="/orders" className="rb-btn rb-blue">
          📦 طلباتي
        </Link>
      </div>
      <p className="no-print text-center text-xs text-zinc-500">
        تم إرسال الطلب إلى الإدارة. إن لم يفتح واتساب تلقائياً اضغط زر الإرسال أعلاه.
      </p>
    </div>
  );
}
