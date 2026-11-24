import { ImageResponse } from "next/og";

// PNG home-screen icon for iPhones (iOS does not use SVG favicons).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e13",
          color: "#e6edf3",
        }}
      >
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -3 }}>CPC</div>
        <div style={{ display: "flex", width: 120, marginTop: 6 }}>
          <div style={{ width: 40, height: 12, background: "#2ee88a", borderRadius: 2 }} />
        </div>
      </div>
    ),
    size,
  );
}
