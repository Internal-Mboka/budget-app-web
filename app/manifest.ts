import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mboka Budget",
    short_name: "Mboka",
    description: "Suivi des revenus et depenses Mboka Budget",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eff8ff",
    theme_color: "#10579F",
    orientation: "portrait",
    icons: [
      {
        src: "/photos/mboka.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/photos/mboka.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/photos/mboka.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
