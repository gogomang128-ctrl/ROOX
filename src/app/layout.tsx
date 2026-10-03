import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";
import { getCurrentUser, getSettings } from "@/lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ROOX | متجر شحن روبكس وعملات روبلوكس",
  description: "اشحن روبكس وعملات الألعاب بأمان وسرعة — الدفع بانستا باي وفودافون كاش وأورنج كاش",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <Providers initialUser={user} initialSettings={settings}>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
