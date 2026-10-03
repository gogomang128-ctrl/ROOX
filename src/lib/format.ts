import type { Order, OrderItem } from "./types";

export const PAYMENT_LABELS: Record<string, string> = {
  wallet: "المحفظة",
  instapay: "انستا باي",
  vodafone: "فودافون كاش",
  orange: "أورنج كاش",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  paid: "تم الدفع",
  completed: "تم التسليم",
  cancelled: "ملغي",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-400 text-black",
  paid: "bg-sky-500 text-white",
  completed: "bg-emerald-500 text-white",
  cancelled: "bg-red-500 text-white",
};

export const CATEGORY_LABELS: Record<string, string> = {
  robux: "باقات روبكس",
  coins: "عملات",
  other: "أخرى",
};

export const TX_LABELS: Record<string, string> = {
  credit: "إضافة رصيد",
  debit: "خصم رصيد",
  purchase: "عملية شراء",
  refund: "استرجاع",
};

export function money(n: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)} ج.م`;
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

export function buildInvoiceText(o: Order, siteName: string): string {
  const items = (o.items as OrderItem[])
    .map((i) => `• ${i.name} × ${i.qty} = ${money(i.price * i.qty)}`)
    .join("\n");
  return [
    `🧾 *فاتورة جديدة - ${siteName}*`,
    `━━━━━━━━━━━━━━`,
    `رقم الفاتورة: *${o.invoiceNo}*`,
    `اسم المستخدم: *${o.username}* (ID: ${o.publicId})`,
    `اسم روبلوكس: *${o.robloxUsername}*`,
    `━━━━━━━━━━━━━━`,
    items,
    `━━━━━━━━━━━━━━`,
    `طريقة الدفع: *${PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}*`,
    o.paymentRef ? `مرجع التحويل: ${o.paymentRef}` : "",
    `الإجمالي: *${money(o.total)}*`,
    `الحالة: ${STATUS_LABELS[o.status] ?? o.status}`,
    `التاريخ: ${fmtDate(o.createdAt)}`,
    o.note ? `ملاحظة: ${o.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
