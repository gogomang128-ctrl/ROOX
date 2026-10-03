"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { useApp } from "./Providers";
import { LogoMark, RobuxIcon } from "./Art";
import AdminPasswordForm from "./AdminPasswordForm";
import { money } from "@/lib/format";

const links = [
  { href: "/", label: "المتجر", icon: "🏠" },
  { href: "/orders", label: "طلباتي", icon: "📦" },
  { href: "/wallet", label: "المحفظة", icon: "👛" },
  { href: "/support", label: "الدعم", icon: "💬" },
];

function Navbar() {
  const { user, logout, cartCount, settings } = useApp();
  const path = usePathname();
  const router = useRouter();

  return (
    <header className="store-header sticky top-0 z-50 no-print">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-3 h-14">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="" className="w-9 h-9 rounded-md object-cover" />
          ) : (
            <LogoMark />
          )}
          <span className="brand-wordmark font-black text-lg tracking-wide">{settings.siteName}<small>PLAY DIFFERENT</small></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ms-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link px-3 py-1.5 rounded-md font-bold text-sm transition ${
                path === l.href ? "nav-link-active text-white" : "text-zinc-300 hover:bg-[#2f3133]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {user ? (
          <>
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 bg-[#101113] border-2 border-[#3b3e43] rounded-md px-2.5 py-1 text-sm font-black text-[#2ee06f]"
              title="رصيد المحفظة"
            >
              <RobuxIcon className="w-4 h-4" />
              {money(user.balance)}
            </Link>
            <div className="hidden sm:flex flex-col leading-tight text-xs text-zinc-300">
              <b className="text-white">{user.username}</b>
              <span>ID: {user.publicId}</span>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="rb-btn rb-gray !py-1 !px-2.5 text-xs"
            >
              خروج
            </button>
          </>
        ) : (
          <Link href="/login" className="rb-btn rb-blue !py-1.5 text-sm">
            تسجيل الدخول
          </Link>
        )}

        <Link href="/cart" className="relative rb-btn rb-green !py-1.5 !px-3" aria-label="السلة">
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-2 -end-2 bg-red-500 text-white text-[11px] font-black rounded-full min-w-5 h-5 grid place-items-center px-1">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function BottomNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#232527] border-t-4 border-[#111214] grid grid-cols-4 no-print">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex flex-col items-center py-1.5 text-[11px] font-bold ${
            path === l.href ? "text-[#4d7bff]" : "text-zinc-400"
          }`}
        >
          <span className="text-lg">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

function Footer() {
  const { settings } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <footer className="mt-16 no-print">
      <div className="baseplate h-14" />
      <div className="bg-[#111214] pt-6 pb-24 md:pb-8 text-center text-xs text-zinc-500 space-y-3">
        <p className="font-bold text-zinc-300">
          © {new Date().getFullYear()} {settings.siteName} — متجر شحن روبكس وعملات الألعاب
        </p>
        <p className="px-4">هذا الموقع غير تابع لشركة Roblox Corporation. Roblox علامة تجارية مسجلة لأصحابها.</p>
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setOpen(true)}
            aria-label="."
            className="w-2.5 h-2.5 rounded-full bg-zinc-600/60 hover:bg-white transition"
          />
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="rb-card pop w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 end-3 text-zinc-400 hover:text-white text-xl"
              aria-label="إغلاق"
            >
              ✕
            </button>
            <AdminPasswordForm
              onSuccess={() => {
                setOpen(false);
                router.push("/admin");
              }}
            />
          </div>
        </div>
      )}
    </footer>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
