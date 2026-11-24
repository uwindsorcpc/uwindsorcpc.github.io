import type { Metadata } from "next";
import { Suspense } from "react";

import { PresenterApp } from "@/components/admin/PresenterApp";

export const metadata: Metadata = {
  title: "Check-in screen",
  robots: { index: false, follow: false, nocache: true },
};

export default function PresentPage() {
  return (
    <Suspense fallback={null}>
      <PresenterApp />
    </Suspense>
  );
}
