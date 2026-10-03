import AdminPanel from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminPanel />;
}
