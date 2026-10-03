"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "./Providers";
import { LogoMark, RobuxIcon } from "./Art";
import { CATEGORY_LABELS, money } from "@/lib/format";
import type { Product } from "@/lib/types";

function ProductCard({ p }: { p: Product }) {
  const { addToCart, toast } = useApp();
  const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <div className="rb-card product-card overflow-hidden flex flex-col group">
      <div className="product-art relative aspect-square grid place-items-center overflow-hidden">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="text-center">
            <RobuxIcon className="w-16 h-16 text-[#7cf4ff] drop-shadow-[0_0_24px_rgba(65,224,255,.5)] floaty mx-auto" />
            {p.amount > 0 && <div className="mt-2 text-2xl font-black">{p.amount.toLocaleString("en-US")}</div>}
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 start-3 bg-[#ff4e85] text-white text-xs font-black px-2.5 py-1 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <h3 className="font-black leading-tight">{p.name}</h3>
        {p.description && <p className="text-xs text-zinc-400 line-clamp-2">{p.description}</p>}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-black text-[#7cf4ff]">{money(p.price)}</span>
          {discount > 0 && p.oldPrice && (
            <span className="text-xs text-zinc-500 line-through">{money(p.oldPrice)}</span>
          )}
        </div>
        <button
          className="rb-btn rb-green text-sm"
          onClick={() => {
            addToCart(p.id);
            toast(`تمت إضافة ${p.name} إلى السلة`);
          }}
        >
          🛒 أضف للسلة
        </button>
      </div>
    </div>
  );
}

export default function Storefront({ products }: { products: Product[] }) {
  const { settings, user } = useApp();
  const cats = Array.from(new Set(products.map((p) => p.category)));
  const [cat, setCat] = useState("all");
  const shown = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <div>
      {settings.announcement && <div className="announcement-bar text-center text-sm font-bold py-2 px-3">{settings.announcement}</div>}

      <section className="cinema-hero relative overflow-hidden" style={settings.heroUrl ? { backgroundImage: `linear-gradient(90deg,rgba(7,10,20,.96),rgba(7,10,20,.7) 52%,rgba(7,10,20,.22)),url(${settings.heroUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-glow hero-glow-blue" aria-hidden="true" />
        <div className="hero-glow hero-glow-pink" aria-hidden="true" />
        <div className="cinema-inner relative max-w-6xl mx-auto px-5 grid lg:grid-cols-[1.05fr_.95fr] items-center gap-8">
          <div className="hero-copy text-center lg:text-start">
            <div className="hero-kicker"><span className="live-dot" /> عالمك يبدأ من هنا <span className="hero-kicker-en">ROOX UNIVERSE</span></div>
            <h1 className="hero-title">العبها <span>بمستوى</span><br /><span className="hero-title-gradient">ROOX</span></h1>
            <p className="hero-tagline">{settings.tagline}</p>
            <p className="hero-caption">تجربة شحن مختلفة. خطوات أقل، أمان أكثر، ومتعتك تبدأ فوراً.</p>
            <div className="mt-7 flex gap-3 justify-center lg:justify-start flex-wrap">
              <a href="#shop" className="rb-btn hero-cta">اكتشف الباقات <span aria-hidden="true">←</span></a>
              {!user && <Link href="/login" className="rb-btn hero-secondary">ابدأ مجاناً <span aria-hidden="true">↗</span></Link>}
            </div>
            <div className="hero-trust-row"><span>✦ دفع محلي سهل</span><i /> <span>✦ متابعة لكل طلب</span><i /> <span>✦ دعم مباشر</span></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="portal-halo" />
            <div className="portal-ring portal-ring-back" />
            <div className="portal-ring portal-ring-front" />
            <div className="portal-core"><div className="portal-core-shine" /><div className="portal-cube"><LogoMark className="w-24 h-24 sm:w-32 sm:h-32" /></div><span className="portal-label">LEVEL UP</span></div>
            <div className="hero-token token-a"><RobuxIcon className="w-8 h-8" /></div>
            <div className="hero-token token-b"><span>R</span></div>
            <div className="hero-token token-c"><RobuxIcon className="w-5 h-5" /></div>
            <div className="hero-scanline" />
          </div>
        </div>
        <div className="hero-bottom max-w-6xl mx-auto px-5">
          <div><strong>01</strong><span>اختَر عالمك</span></div><div><strong>02</strong><span>اشحن بثقة</span></div><div><strong>03</strong><span>عُد للّعب</span></div>
          <a href="#shop" className="hero-scroll">مرّر للاستكشاف <span>↓</span></a>
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="max-w-6xl mx-auto px-3 pt-8">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="flex-1"><p className="section-eyebrow">اختر طريقك للّعب</p><h2 className="text-2xl font-black">باقات تشحن حماسك <span className="section-spark">✳</span></h2></div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...cats].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rb-btn !py-1 !px-3 text-sm ${cat === c ? "rb-blue" : "rb-gray"}`}
              >
                {c === "all" ? "الكل" : CATEGORY_LABELS[c] ?? c}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="rb-card p-10 text-center text-zinc-400">لا توجد منتجات متاحة حالياً</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-3 pt-10">
        <div className="why-roox grid sm:grid-cols-3 gap-3">
          {[["◈", "دفع بالطريقة اللي تناسبك", "محفظة، إنستا باي، فودافون كاش أو أورنج."], ["ϟ", "طلبك واضح من البداية", "فاتورة ومتابعة للحالة في كل خطوة."], ["✦", "دعم موجود وقت ما تحتاج", "تواصل بسهولة لو احتجت مساعدة."]].map(([icon, title, body]) => <article className="why-card" key={title}><span className="why-icon">{icon}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-3 pt-12">
        <p className="section-eyebrow">بكل بساطة</p><h2 className="text-2xl font-black mb-4">من المتجر إلى اللعبة — ٤ خطوات</h2>
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            ["1", "سجّل دخولك", "أنشئ حساباً أو سجّل الدخول باسم المستخدم وكلمة المرور"],
            ["2", "اختر الباقة", "أضف الباقة المناسبة إلى السلة"],
            ["3", "ادفع", "محفظة، انستا باي، فودافون كاش أو أورنج كاش"],
            ["4", "استلم", "تصلك فاتورتك وتُسلَّم الباقة لحسابك بعد المراجعة"],
          ].map(([n, t, d]) => (
            <div key={n} className="rb-card p-4">
              <div className="w-9 h-9 rounded-md bg-[#335fff] grid place-items-center font-black mb-2 shadow-[0_3px_0_rgba(0,0,0,.4)]">
                {n}
              </div>
              <h3 className="font-black">{t}</h3>
              <p className="text-sm text-zinc-400 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
