import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { PLATFORMS } from "@/lib/db/types";
import { NAV_LINKS } from "@/lib/nav";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...NAV_LINKS.map((l) => l.href), "/join", ...PLATFORMS.map((p) => `/resources/${p}`)];
  return paths.map((p) => ({ url: new URL(p, site.url).toString(), changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
