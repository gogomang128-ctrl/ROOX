"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import type { PublicUser, SiteSettings } from "@/lib/types";

type CartLine = { id: number; qty: number };
type Toast = { id: number; msg: string; type: "ok" | "err" };

type Ctx = {
  user: PublicUser | null;
  setUser: (u: PublicUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
  cart: CartLine[];
  addToCart: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartCount: number;
  toast: (msg: string, type?: "ok" | "err") => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

export default function Providers({
  children,
  initialUser,
  initialSettings,
}: {
  children: ReactNode;
  initialUser: PublicUser | null;
  initialSettings: SiteSettings;
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("rx_cart");
        if (raw) setCart(JSON.parse(raw));
      } catch {}
      loaded.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded.current) localStorage.setItem("rx_cart", JSON.stringify(cart));
  }, [cart]);

  const refreshUser = useCallback(async () => {
    const r = await api("/api/auth/me");
    if (r.ok) setUser(r.data.user ?? null);
  }, []);

  // keep the wallet balance fresh (admin may add funds at any time)
  useEffect(() => {
    if (!user) return;
    const t = setInterval(refreshUser, 15000);
    return () => clearInterval(t);
  }, [user, refreshUser]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", "POST");
    setUser(null);
  }, []);

  const toast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((id: number, qty = 1) => {
    setCart((c) => {
      const ex = c.find((l) => l.id === id);
      if (ex) return c.map((l) => (l.id === id ? { ...l, qty: Math.min(50, l.qty + qty) } : l));
      return [...c, { id, qty }];
    });
  }, []);
  const setQty = useCallback((id: number, qty: number) => {
    setCart((c) =>
      c.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(50, qty)) } : l)),
    );
  }, []);
  const removeFromCart = useCallback((id: number) => setCart((c) => c.filter((l) => l.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      setUser,
      refreshUser,
      logout,
      settings,
      setSettings,
      cart,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      cartCount: cart.reduce((s, l) => s + l.qty, 0),
      toast,
    }),
    [user, refreshUser, logout, settings, cart, addToCart, setQty, removeFromCart, clearCart, toast],
  );

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="fixed top-16 start-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pop rb-btn !justify-start text-sm ${t.type === "ok" ? "rb-green" : "rb-red"}`}
          >
            {t.type === "ok" ? "✅" : "⚠️"} {t.msg}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
