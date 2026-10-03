"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TX_LABELS, fmtDate, money } from "@/lib/format";
import { useApp } from "../Providers";

type U = { id: number; publicId: string; username: string; balance: number; banned: boolean; createdAt: string };
type Tx = { id: number; username: string; type: string; amount: number; balanceAfter: number; note: string; createdAt: string };

export default function UsersTab({ onChat }: { onChat: (id: number, username: string) => void }) {
  const { toast } = useApp();
  const [users, setUsers] = useState<U[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [q, setQ] = useState("");
  // wallet form
  const [wName, setWName] = useState("");
  const [wAmount, setWAmount] = useState("");
  const [wNote, setWNote] = useState("");
  // new user form
  const [nName, setNName] = useState("");
  const [nPass, setNPass] = useState("");

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([api("/api/admin/users"), api("/api/admin/wallet")]);
    if (a.ok) setUsers(a.data.users);
    if (b.ok) setTxs(b.data.transactions);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function adjust(action: "add" | "deduct") {
    const r = await api("/api/admin/wallet", "POST", { username: wName, amount: wAmount, action, note: wNote });
    if (r.ok) {
      toast(`${action === "add" ? "تمت إضافة" : "تم خصم"} ${money(Number(wAmount))} — رصيد ${r.data.username} الآن ${money(r.data.balance)}`);
      setWAmount("");
      setWNote("");
      load();
    } else toast(r.data.error || "فشل", "err");
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("/api/admin/users", "POST", { username: nName, password: nPass });
    if (r.ok) {
      toast(`تم إنشاء الحساب — ID: ${r.data.publicId}`);
      setNName("");
      setNPass("");
      load();
    } else toast(r.data.error || "فشل", "err");
  }

  async function resetPw(u: U) {
    const pw = prompt(`كلمة مرور جديدة للعميل ${u.username}:`);
    if (!pw) return;
    const r = await api("/api/admin/users", "PATCH", { id: u.id, password: pw });
    toast(r.ok ? "تم تغيير كلمة المرور" : r.data.error || "فشل", r.ok ? "ok" : "err");
  }
  async function toggleBan(u: U) {
    const r = await api("/api/admin/users", "PATCH", { id: u.id, banned: !u.banned });
    if (r.ok) load();
  }
  async function del(u: U) {
    if (!confirm(`حذف حساب ${u.username} نهائياً؟`)) return;
    const r = await api(`/api/admin/users?id=${u.id}`, "DELETE");
    if (r.ok) {
      toast("تم الحذف");
      load();
    }
  }

  const shown = users.filter((u) => (u.username + u.publicId).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rb-card p-4 space-y-3">
          <h3 className="font-black text-lg">👛 إضافة / خصم رصيد</h3>
          <div>
            <label className="rb-label">اسم العميل (اسم المستخدم الذي يدخل به)</label>
            <input className="rb-input" list="usernames" value={wName} onChange={(e) => setWName(e.target.value)} placeholder="اكتب اسم العميل" />
            <datalist id="usernames">
              {users.map((u) => (
                <option key={u.id} value={u.username} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="rb-label">المبلغ (ج.م)</label>
              <input className="rb-input" type="number" min="0" step="0.01" value={wAmount} onChange={(e) => setWAmount(e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="rb-label">ملاحظة</label>
              <input className="rb-input" value={wNote} onChange={(e) => setWNote(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="rb-btn rb-green" disabled={!wName || !wAmount} onClick={() => adjust("add")}>➕ إضافة أموال</button>
            <button className="rb-btn rb-red" disabled={!wName || !wAmount} onClick={() => adjust("deduct")}>➖ سحب أموال</button>
          </div>
        </div>

        <form onSubmit={createUser} className="rb-card p-4 space-y-3">
          <h3 className="font-black text-lg">➕ إنشاء حساب عميل</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="rb-label">اسم المستخدم</label>
              <input className="rb-input" value={nName} onChange={(e) => setNName(e.target.value)} />
            </div>
            <div>
              <label className="rb-label">كلمة المرور</label>
              <input className="rb-input" type="password" minLength={8} value={nPass} onChange={(e) => setNPass(e.target.value)} />
            </div>
          </div>
          <button className="rb-btn rb-blue w-full" disabled={!nName || nPass.length < 8}>إنشاء الحساب</button>
          <p className="text-xs text-zinc-400">يتم توليد ID خاص بكل عميل تلقائياً. كلمات المرور مشفّرة ولا يمكن عرضها، يمكنك تغييرها فقط.</p>
        </form>
      </div>

      <div className="rb-card p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-black text-lg flex-1">👥 العملاء ({users.length})</h3>
          <input className="rb-input !w-56" placeholder="بحث بالاسم أو ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-zinc-400 text-xs">
              <tr>
                <th className="text-start p-2">ID</th>
                <th className="text-start p-2">الاسم</th>
                <th className="text-start p-2">الرصيد</th>
                <th className="text-start p-2">التسجيل</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-t border-[#3b3e43]">
                  <td className="p-2 font-bold" dir="ltr">{u.publicId}</td>
                  <td className="p-2 font-black">
                    {u.username} {u.banned && <span className="text-red-400 text-xs">(موقوف)</span>}
                  </td>
                  <td className="p-2 text-[#2ee06f] font-black">{money(u.balance)}</td>
                  <td className="p-2 text-xs text-zinc-400">{fmtDate(u.createdAt)}</td>
                  <td className="p-2">
                    <div className="flex gap-1 flex-wrap justify-center">
                      <button className="rb-btn rb-blue !py-0.5 !px-2 text-xs" onClick={() => setWName(u.username)}>محفظة</button>
                      <button className="rb-btn rb-gray !py-0.5 !px-2 text-xs" onClick={() => onChat(u.id, u.username)}>💬</button>
                      <button className="rb-btn rb-gray !py-0.5 !px-2 text-xs" onClick={() => resetPw(u)}>🔑</button>
                      <button className="rb-btn rb-gold !py-0.5 !px-2 text-xs" onClick={() => toggleBan(u)}>{u.banned ? "فك الإيقاف" : "إيقاف"}</button>
                      <button className="rb-btn rb-red !py-0.5 !px-2 text-xs" onClick={() => del(u)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-zinc-500">لا يوجد عملاء</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rb-card p-4">
        <h3 className="font-black text-lg mb-2">🧾 آخر عمليات المحافظ</h3>
        <div className="max-h-80 overflow-y-auto divide-y divide-[#3b3e43] text-sm">
          {txs.map((t) => (
            <div key={t.id} className="py-2 flex items-center gap-3">
              <b className="w-28 truncate">{t.username}</b>
              <span className="text-xs text-zinc-400 w-24">{TX_LABELS[t.type]}</span>
              <span className={`font-black w-24 ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`} dir="ltr">{t.amount >= 0 ? "+" : ""}{money(t.amount)}</span>
              <span className="flex-1 text-xs text-zinc-500 truncate">{t.note}</span>
              <span className="text-[11px] text-zinc-500">{fmtDate(t.createdAt)}</span>
            </div>
          ))}
          {txs.length === 0 && <p className="text-center text-zinc-500 py-4">لا توجد عمليات</p>}
        </div>
      </div>
    </div>
  );
}
