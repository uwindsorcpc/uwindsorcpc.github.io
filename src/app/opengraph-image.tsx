import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

// Social preview image used by every page (Discord, LinkedIn, iMessage…).
// Colours mirror the dark palette in globals.css.
export const alt = `${site.name}: ${site.fullName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0a0e13",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          color: "#e6edf3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, color: "#9aa8b8" }}>
          <span style={{ color: "#2ee88a", marginRight: 14 }}>$</span> ./join --club cpc-uwindsor
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
            <span style={{ color: "#2ee88a" }}>&lt;</span>CPC<span style={{ color: "#2ee88a" }}>/&gt;</span>
          </div>
          <div style={{ display: "flex", fontSize: 54, color: "#9aa8b8", marginTop: 12 }}>
            UWindsor<span style={{ color: "#2ee88a" }}>_</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>{site.home.headline}</div>
      </div>
    ),
    size,
  );
}
