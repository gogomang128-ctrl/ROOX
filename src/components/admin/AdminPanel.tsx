"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/hooks";
import type { Order } from "@/lib/types";
import AdminPasswordForm from "../AdminPasswordForm";
import { LogoMark } from "../Art";
import { useApp } from "../Providers";
import ChatTab, { type Thread } from "./ChatTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import SettingsTab from "./SettingsTab";
import UsersTab from "./UsersTab";
import { money } from "@/lib/format";

type Tab = "orders" | "users" | "products" | "chat" | "settings";

export default function AdminPanel() {
  const { settings } = useApp();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [chatSel, setChatSel] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    api("/api/admin/auth").then((r) => setAuthed(!!r.data.admin));
  }, []);

  const loadOrders = useCallback(async () => {
    const r = await api("/api/admin/orders");
    if (r.ok) setOrders(r.data.orders);
  }, []);
  const loadThreads = useCallback(async () => {
    const r = await api("/api/admin/chat");
    if (r.ok) setThreads(r.data.threads);
  }, []);

  usePoll(
    async () => {
      await Promise.all([loadOrders(), loadThreads()]);
    },
    6000,
    authed === true,
  );

  async function logout() {
    await api("/api/admin/auth", "DELETE");
    setAuthed(false);
  }

  if (authed === null) return <div className="min-h-screen grid place-items-center text-zinc-400">...</div>;

  if (!authed)
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="rb-card p-6 w-full max-w-sm space-y-4">
          <AdminPasswordForm onSuccess={() => setAuthed(true)} />
          <Link href="/" className="block text-center text-sm text-zinc-400 hover:text-white">
            ← العودة للمتجر
          </Link>
        </div>
      </div>
    );

  const pending = orders.filter((o) => o.status === "pending").length;
  const unread = threads.reduce((s, t) => s + t.unread, 0);
  const revenue = orders.filter((o) => o.status === "paid" || o.status === "completed").reduce((s, o) => s + o.total, 0);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "orders", label: "📦 الطلبات", badge: pending },
    { id: "users", label: "👥 العملاء والمحافظ" },
    { id: "products", label: "🛍 المنتجات والباقات" },
    { id: "chat", label: "💬 المحادثات", badge: unread },
    { id: "settings", label: "⚙️ الإعدادات" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-[#232527] border-b-4 border-[#111214] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 h-14 flex items-center gap-3">
          <LogoMark />
          <b className="text-lg">لوحة تحكم {settings.siteName}</b>
          <div className="flex-1" />
          <Link href="/" className="rb-btn rb-gray !py-1 text-sm">🏠 المتجر</Link>
          <button onClick={logout} className="rb-btn rb-red !py-1 text-sm">خروج</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 py-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["طلبات جديدة", String(pending), "text-amber-400"],
            ["إجمالي الطلبات", String(orders.length), "text-sky-400"],
            ["إيراد مؤكد", money(revenue), "text-[#2ee06f]"],
            ["رسائل غير مقروءة", String(unread), "text-red-400"],
          ].map(([l, v, c]) => (
            <div key={l} className="rb-card p-3">
              <div className="text-xs text-zinc-400">{l}</div>
              <div className={`text-xl font-black ${c}`}>{v}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rb-btn whitespace-nowrap relative ${tab === t.id ? "rb-blue" : "rb-gray"}`}
            >
              {t.label}
              {!!t.badge && t.badge > 0 && (
                <span className="bg-red-500 rounded-full text-xs px-1.5 font-black">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "orders" && <OrdersTab orders={orders} reload={loadOrders} />}
        {tab === "users" && (
          <UsersTab
            onChat={(id, username) => {
              setChatSel({ id, username });
              setTab("chat");
            }}
          />
        )}
        {tab === "products" && <ProductsTab />}
        {tab === "chat" && (
          <ChatTab threads={threads} reloadThreads={loadThreads} selected={chatSel} setSelected={setChatSel} />
        )}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
