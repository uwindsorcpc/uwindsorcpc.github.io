import type { Metadata } from "next";

import { AdminApp } from "@/components/admin/AdminApp";

// Not linked from the site and kept out of search engines. The login, 2FA and
// the database's own rules are what actually protect it.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminApp />;
}
