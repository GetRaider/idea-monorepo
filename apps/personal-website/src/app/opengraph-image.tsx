import { ImageResponse } from "next/og";

import { profile } from "@/data/profile";

export const alt = `${profile.name}, ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0b1119",
          backgroundImage: "linear-gradient(100deg, #4a221c 0%, #0b1119 45%, #0b1119 60%, #2d4058 100%)",
          color: "#f4eee6",
        }}
      >
        <div style={{ fontSize: 28, color: "#f2a25a", letterSpacing: 2 }}>{profile.status.toUpperCase()}</div>
        <div style={{ fontSize: 96, fontWeight: 600, marginTop: 24, letterSpacing: -3 }}>{profile.name}</div>
        <div style={{ fontSize: 44, color: "#f2a25a", marginTop: 12 }}>{profile.title}</div>
        <div style={{ fontSize: 28, color: "#9ba7b9", marginTop: 36, maxWidth: 940, lineHeight: 1.4 }}>
          {profile.oneLiner}
        </div>
      </div>
    ),
    size,
  );
}
