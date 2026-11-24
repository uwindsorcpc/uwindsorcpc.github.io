import type { Metadata } from "next";
import { Suspense } from "react";

import { PresenterApp } from "@/components/admin/PresenterApp";

export const metadata: Metadata = {
  title: "Event control",
  robots: { index: false, follow: false, nocache: true },
};

export default function PresentPage() {
  return (
    <Suspense fallback={null}>
      <PresenterApp />
    </Suspense>
  );
}
