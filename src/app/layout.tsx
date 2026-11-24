import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";

import { themeInitScript } from "@/components/ThemeToggle";
import { site } from "@/lib/content";
import "./globals.css";

// Fonts are downloaded at build time and served from this site,
// so visitors never make a request to Google.
// Archivo is variable in weight AND width: condensed for headlines, normal for text.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { template: `%s | ${site.name}`, default: `${site.name}: ${site.fullName}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["competitive programming", "ICPC", "University of Windsor", "UWindsor", "ECNA", "algorithms", "Kattis", "student club"],
  openGraph: { type: "website", siteName: site.name, locale: "en_CA" },
  twitter: { card: "summary_large_image" },
  icons: { apple: "/apple-touch-icon.png" },
  // Google Search Console ownership check (public by design).
  verification: { google: "ifhw3kUUyO5RCidgOLrTOXHN7Ewyd9zwrHFcK2hjGCc" },
};

export const viewport: Viewport = {
  themeColor: "#1f1f1f",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${archivo.variable} ${jetbrainsMono.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
