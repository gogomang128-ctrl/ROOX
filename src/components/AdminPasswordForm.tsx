"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function AdminPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await api("/api/admin/auth", "POST", { password: pw });
    setBusy(false);
    if (r.ok) onSuccess();
    else setErr(r.data.error || "كلمة المرور غير صحيحة");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="text-center text-4xl">🔐</div>
      <h2 className="text-center text-xl font-black">دخول الأدمن</h2>
      <p className="text-center text-sm text-zinc-400">اكتب كلمة مرور لوحة التحكم</p>
      <input
        type="password"
        autoFocus
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="كلمة المرور"
        className="rb-input text-center tracking-widest"
        dir="ltr"
      />
      {err && <p className="text-center text-sm text-red-400 font-bold">{err}</p>}
      <button disabled={busy || !pw} className="rb-btn rb-blue w-full">
        {busy ? "جاري التحقق..." : "دخول"}
      </button>
    </form>
  );
}
