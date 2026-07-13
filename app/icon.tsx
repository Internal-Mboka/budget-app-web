import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

async function getLogoDataUrl() {
  const logoPath = path.join(process.cwd(), "public", "photos", "mboka.png");
  const logoBuffer = await readFile(logoPath);
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}

export default async function Icon() {
  const logoSrc = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #8bd7ff 0%, #10579F 100%)",
          padding: 36,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 92,
            border: "8px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 312,
              height: 312,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 84,
              background: "rgba(255,255,255,0.16)",
              boxShadow: "0 18px 50px rgba(6, 42, 80, 0.22)",
            }}
          >
            <img
              src={logoSrc}
              alt="Mboka"
              width="220"
              height="220"
              style={{
                objectFit: "contain",
                filter:
                  "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(2%) hue-rotate(193deg) brightness(104%) contrast(101%)",
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 120,
            border: "4px solid rgba(255,255,255,0.08)",
          }}
        />
      </div>
    ),
    size
  );
}