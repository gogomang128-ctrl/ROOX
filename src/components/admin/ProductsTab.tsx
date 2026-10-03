"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useApp } from "../Providers";
import ImageUpload from "./ImageUpload";

type Form = {
  id?: number;
  name: string;
  description: string;
  category: string;
  amount: string;
  price: string;
  oldPrice: string;
  imageUrl: string;
  active: boolean;
  sortOrder: string;
};

const empty: Form = {
  name: "",
  description: "",
  category: "robux",
  amount: "",
  price: "",
  oldPrice: "",
  imageUrl: "",
  active: true,
  sortOrder: "0",
};

export default function ProductsTab() {
  const { toast } = useApp();
  const [list, setList] = useState<Product[]>([]);
  const [f, setF] = useState<Form>(empty);

  const load = useCallback(async () => {
    const r = await api("/api/admin/products");
    if (r.ok) setList(r.data.products);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const set = (k: keyof Form, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...f,
      amount: Number(f.amount) || 0,
      price: Number(f.price),
      oldPrice: f.oldPrice === "" ? null : Number(f.oldPrice),
      sortOrder: Number(f.sortOrder) || 0,
    };
    const r = f.id ? await api("/api/admin/products", "PATCH", body) : await api("/api/admin/products", "POST", body);
    if (r.ok) {
      toast(f.id ? "تم تعديل المنتج" : "تمت إضافة المنتج");
      setF(empty);
      load();
    } else toast(r.data.error || "فشل", "err");
  }

  function edit(p: Product) {
    setF({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      amount: String(p.amount),
      price: String(p.price),
      oldPrice: p.oldPrice === null ? "" : String(p.oldPrice),
      imageUrl: p.imageUrl,
      active: p.active,
      sortOrder: String(p.sortOrder),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggle(p: Product) {
    await api("/api/admin/products", "PATCH", { ...p, active: !p.active });
    load();
  }
  async function del(p: Product) {
    if (!confirm(`حذف ${p.name}؟`)) return;
    await api(`/api/admin/products?id=${p.id}`, "DELETE");
    toast("تم الحذف");
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="rb-card p-4 space-y-3">
        <h3 className="font-black text-lg">{f.id ? "✏️ تعديل منتج" : "➕ إضافة باقة / منتج"}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="rb-label">الاسم *</label>
            <input className="rb-input" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="rb-label">القسم</label>
            <select className="rb-input" value={f.category} onChange={(e) => set("category", e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="rb-label">الكمية (روبكس/عملات)</label>
            <input className="rb-input" type="number" min="0" value={f.amount} onChange={(e) => set("amount", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="rb-label">السعر (ج.م) *</label>
            <input className="rb-input" type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="rb-label">السعر قبل الخصم (اختياري)</label>
            <input className="rb-input" type="number" min="0" step="0.01" value={f.oldPrice} onChange={(e) => set("oldPrice", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="rb-label">الترتيب</label>
            <input className="rb-input" type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className="rb-label">الوصف</label>
            <input className="rb-input" value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <ImageUpload value={f.imageUrl} onChange={(u) => set("imageUrl", u)} label="صورة المنتج" />
          <label className="flex items-center gap-2 font-bold">
            <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="w-5 h-5" />
            ظاهر في المتجر
          </label>
        </div>
        <div className="flex gap-2">
          <button className="rb-btn rb-green" disabled={!f.name || !f.price}>{f.id ? "حفظ التعديل" : "إضافة"}</button>
          {f.id && (
            <button type="button" className="rb-btn rb-gray" onClick={() => setF(empty)}>إلغاء</button>
          )}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((p) => (
          <div key={p.id} className={`rb-card p-3 flex gap-3 ${p.active ? "" : "opacity-50"}`}>
            <div className="w-16 h-16 rounded-md bg-[#101113] overflow-hidden grid place-items-center shrink-0">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">💎</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black truncate">{p.name}</div>
              <div className="text-xs text-zinc-400">{CATEGORY_LABELS[p.category]} • {money(p.price)}</div>
              <div className="flex gap-1 mt-2 flex-wrap">
                <button className="rb-btn rb-blue !py-0.5 !px-2 text-xs" onClick={() => edit(p)}>تعديل</button>
                <button className="rb-btn rb-gold !py-0.5 !px-2 text-xs" onClick={() => toggle(p)}>{p.active ? "إخفاء" : "إظهار"}</button>
                <button className="rb-btn rb-red !py-0.5 !px-2 text-xs" onClick={() => del(p)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
