import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

// Social preview image (Discord, LinkedIn, iMessage…), built at deploy time
// and served as /og.png. Colours mirror the dark palette in globals.css.
export const dynamic = "force-static";

const OG_SIZE = { width: 1200, height: 630 };

export function GET() {
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
          background: "#1f1f1f",
          color: "#cccccc",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#9d9d9d" }}>UWindsor Competitive Programming Club</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
            <span style={{ color: "#0078d4" }}>&lt;</span>CPC<span style={{ color: "#0078d4" }}>/&gt;</span>
          </div>
          <div style={{ display: "flex", fontSize: 54, color: "#9d9d9d", marginTop: 12 }}>
            UWindsor<span style={{ color: "#0078d4" }}>_</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>{site.home.headline}</div>
      </div>
    ),
    OG_SIZE,
  );
}
