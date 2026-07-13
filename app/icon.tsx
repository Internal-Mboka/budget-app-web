import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

async function getLogoDataUrl() {
  const logoBuffer = await readFile(process.cwd() + "/public/photos/mboka.png");
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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            borderRadius: 64,
            border: "8px solid rgba(255,255,255,0.18)",
          }}
        />
        <img
          src={logoSrc}
          alt="Mboka"
          width="320"
          height="320"
          style={{
            objectFit: "contain",
            filter:
              "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(2%) hue-rotate(193deg) brightness(104%) contrast(101%)",
          }}
        />
      </div>
    ),
    size
  );
}