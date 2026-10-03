"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { useApp } from "../Providers";
import ImageUpload from "./ImageUpload";

const fields: [keyof SiteSettings, string][] = [
  ["siteName", "اسم الموقع"],
  ["tagline", "الشعار النصي"],
  ["announcement", "شريط الإعلان (اتركه فارغاً لإخفائه)"],
  ["whatsapp", "رقم واتساب لاستقبال الفواتير (بصيغة دولية: 201147497465)"],
  ["instapay", "حساب/رقم انستا باي"],
  ["vodafone", "رقم فودافون كاش"],
  ["orange", "رقم أورنج كاش"],
];

export default function SettingsTab() {
  const { settings, setSettings, toast } = useApp();
  const [s, setS] = useState<SiteSettings>(settings);

  async function save() {
    const r = await api("/api/admin/settings", "PUT", s);
    if (r.ok) {
      setSettings(r.data.settings);
      toast("تم حفظ الإعدادات");
    } else toast(r.data.error || "فشل", "err");
  }

  return (
    <div className="rb-card p-4 space-y-4 max-w-2xl">
      <h3 className="font-black text-lg">⚙️ إعدادات الموقع</h3>
      <div className="grid gap-3">
        {fields.map(([k, label]) => (
          <div key={k}>
            <label className="rb-label">{label}</label>
            <input className="rb-input" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
          </div>
        ))}
        <ImageUpload label="شعار الموقع (Logo)" value={s.logoUrl} onChange={(u) => setS({ ...s, logoUrl: u })} max={256} />
        <ImageUpload label="صورة خلفية الواجهة الرئيسية (Banner)" value={s.heroUrl} onChange={(u) => setS({ ...s, heroUrl: u })} max={1600} />
      </div>
      <button className="rb-btn rb-green" onClick={save}>💾 حفظ الإعدادات</button>
      <p className="text-xs text-zinc-500">
        لإرسال الفاتورة إلى واتساب تلقائياً بدون أي ضغطة، أضف متغير البيئة CALLMEBOT_APIKEY (خدمة CallMeBot المجانية).
        بدونه يفتح واتساب للعميل برسالة الفاتورة جاهزة للإرسال، وتصل الطلبات دائماً إلى لوحة الأدمن.
      </p>
    </div>
  );
}
