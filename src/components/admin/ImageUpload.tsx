"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

function compress(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/webp", 0.85));
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = url;
  });
}

export default function ImageUpload({
  value,
  onChange,
  label = "الصورة",
  max = 900,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(f?: File) {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const data = await compress(f, max);
      const r = await api("/api/admin/upload", "POST", { data });
      if (r.ok) onChange(r.data.url);
      else setErr(r.data.error || "فشل الرفع");
    } catch {
      setErr("تعذر قراءة الصورة");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <label className="rb-label">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-lg bg-[#101113] border-2 border-dashed border-[#3b3e43] grid place-items-center overflow-hidden shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl opacity-40">🖼</span>
          )}
        </div>
        <div className="space-y-1">
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <div className="flex gap-2">
            <button type="button" className="rb-btn rb-blue !py-1.5 text-sm" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "جاري الرفع..." : "📤 رفع صورة"}
            </button>
            {value && (
              <button type="button" className="rb-btn rb-gray !py-1.5 text-sm" onClick={() => onChange("")}>
                إزالة
              </button>
            )}
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}
