"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { api } from "@/lib/api";
import { LogoMark } from "@/components/Art";

export default function LoginPage() {
  const { setUser, toast, settings } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await api(`/api/auth/${mode}`, "POST", { username, password });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "حدث خطأ");
    setUser(r.data.user);
    toast(mode === "login" ? `أهلاً ${r.data.user.username}!` : "تم إنشاء حسابك بنجاح");
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") ? next : "/");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="rb-card p-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <LogoMark className="w-14 h-14" />
          <h1 className="text-2xl font-black">{settings.siteName}</h1>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMode("login")} className={`rb-btn ${mode === "login" ? "rb-blue" : "rb-gray"}`}>
            تسجيل الدخول
          </button>
          <button onClick={() => setMode("register")} className={`rb-btn ${mode === "register" ? "rb-blue" : "rb-gray"}`}>
            حساب جديد
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="rb-label">اسم المستخدم</label>
            <input
              className="rb-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="مثال: ahmed_99"
            />
          </div>
          <div>
            <label className="rb-label">كلمة المرور</label>
            <input
              className="rb-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
            />
          </div>
          {err && <p className="text-red-400 text-sm font-bold">{err}</p>}
          <button className="rb-btn rb-green w-full !py-3" disabled={busy || !username || !password}>
            {busy ? "..." : mode === "login" ? "▶ دخول" : "إنشاء الحساب"}
          </button>
        </form>
        <p className="text-xs text-zinc-400 text-center">
          لكل عميل حساب ومحفظة ورقم تعريف (ID) خاص به. شحن المحفظة يتم من الإدارة فقط.
        </p>
      </div>
    </div>
  );
}
