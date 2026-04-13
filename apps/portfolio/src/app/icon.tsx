import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 48,
  height: 48,
};

export const contentType = "image/png";

export default async function Icon() {
  const filePath = join(process.cwd(), "src/images/portfolio-logo.png");
  const buffer = await readFile(filePath);
  const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          borderRadius: size.width / 2,
          overflow: "hidden",
        }}
      >
        <img
          alt=""
          src={dataUrl}
          width={size.width}
          height={size.height}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
