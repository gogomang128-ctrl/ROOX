export type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  amount: number;
  price: number;
  oldPrice: number | null;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
};

export type OrderItem = {
  productId: number;
  name: string;
  qty: number;
  price: number;
  amount: number;
};

export type Order = {
  id: number;
  invoiceNo: string;
  userId: number;
  username: string;
  publicId: string;
  robloxUsername: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  paymentRef: string;
  note: string;
  status: string;
  createdAt: string;
};

export type PublicUser = {
  id: number;
  publicId: string;
  username: string;
  balance: number;
};

export type ChatMessage = {
  id: number;
  sender: string;
  body: string;
  createdAt: string;
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  announcement: string;
  whatsapp: string;
  instapay: string;
  vodafone: string;
  orange: string;
  logoUrl: string;
  heroUrl: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "ROOX",
  tagline: "أرخص وأسرع متجر لشحن الروبكس والعملات",
  announcement: "🎮 مرحباً بك في ROOX — اشحن روبكس بأمان وسرعة!",
  whatsapp: "201147497465",
  instapay: "01147497465",
  vodafone: "01147497465",
  orange: "01147497465",
  logoUrl: "",
  heroUrl: "",
};
