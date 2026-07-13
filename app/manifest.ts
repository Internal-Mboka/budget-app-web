import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mboka Budget",
    short_name: "Mboka",
    description: "Suivi des revenus et depenses Mboka Budget",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#eff8ff",
    theme_color: "#10579F",
    orientation: "portrait",
    icons: [
      {
        src: "/icon?size=192&v=3",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon?size=512&v=3",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
