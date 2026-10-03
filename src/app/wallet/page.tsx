"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/Providers";
import { RobuxIcon } from "@/components/Art";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/hooks";
import { TX_LABELS, fmtDate, money } from "@/lib/format";

type Tx = { id: number; type: string; amount: number; balanceAfter: number; note: string; createdAt: string };

export default function WalletPage() {
  const { user, settings } = useApp();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [balance, setBalance] = useState<number | null>(null);

  usePoll(
    async () => {
      const r = await api("/api/wallet");
      if (r.ok) {
        setTxs(r.data.transactions);
        setBalance(r.data.balance);
      }
    },
    8000,
    !!user,
  );

  if (!user)
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <div className="text-5xl">👛</div>
        <h1 className="text-2xl font-black">المحفظة</h1>
        <p className="text-zinc-400">سجّل الدخول لعرض محفظتك.</p>
        <Link href="/login?next=/wallet" className="rb-btn rb-blue">
          تسجيل الدخول
        </Link>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-3 py-6 space-y-4">
      <div className="rounded-xl p-5 bg-gradient-to-br from-[#335fff] to-[#1a2f94] border-b-8 border-black/30 relative overflow-hidden">
        <RobuxIcon className="absolute -start-4 -bottom-6 w-36 h-36 text-white/10" />
        <div className="text-sm font-bold opacity-80">رصيد محفظتك</div>
        <div className="text-4xl font-black mt-1">{money(balance ?? user.balance)}</div>
        <div className="mt-3 text-sm flex flex-wrap gap-x-6 gap-y-1 opacity-90">
          <span>👤 {user.username}</span>
          <span>🆔 {user.publicId}</span>
        </div>
      </div>

      <div className="rb-card p-4 text-sm space-y-2">
        <h2 className="font-black text-base">كيف أشحن محفظتي؟</h2>
        <p className="text-zinc-300">
          شحن المحفظة يتم عن طريق الإدارة فقط. حوّل المبلغ على أحد الأرقام التالية ثم راسل الإدارة من
          <Link href="/support" className="text-[#6c8cff] font-bold"> خدمة العملاء </Link>
          مع اسم المستخدم الخاص بك، وسيتم إضافة الرصيد لك.
        </p>
        <div className="grid sm:grid-cols-3 gap-2 text-center">
          {[
            ["🏦 انستا باي", settings.instapay],
            ["🔴 فودافون كاش", settings.vodafone],
            ["🟠 أورنج كاش", settings.orange],
          ].map(([l, v]) => (
            <div key={l} className="bg-[#101113] rounded-lg p-2">
              <div className="text-xs text-zinc-400">{l}</div>
              <div dir="ltr" className="font-black">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rb-card p-4">
        <h2 className="font-black mb-3">سجل العمليات</h2>
        {txs.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">لا توجد عمليات بعد</p>
        ) : (
          <ul className="divide-y divide-[#3b3e43]">
            {txs.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-md grid place-items-center font-black ${
                    t.amount >= 0 ? "bg-emerald-600" : "bg-red-600"
                  }`}
                >
                  {t.amount >= 0 ? "+" : "−"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{TX_LABELS[t.type] ?? t.type}</div>
                  <div className="text-xs text-zinc-400 truncate">{t.note}</div>
                  <div className="text-[11px] text-zinc-500">{fmtDate(t.createdAt)}</div>
                </div>
                <div className="text-end">
                  <div className={`font-black ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`} dir="ltr">
                    {t.amount >= 0 ? "+" : ""}
                    {money(t.amount)}
                  </div>
                  <div className="text-[11px] text-zinc-500">الرصيد: {money(t.balanceAfter)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
