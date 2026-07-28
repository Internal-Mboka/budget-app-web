import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: "/login",
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    importScripts: ["/offline-sync-sw.js"],
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
          sameOrigin &&
          (url.pathname.startsWith("/dashboard") ||
            url.pathname.startsWith("/revenues") ||
            url.pathname.startsWith("/expenses") ||
            url.pathname.startsWith("/clients")),
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "mboka-essential-pages",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 72 * 60 * 60,
          },
          networkTimeoutSeconds: 8,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "@prisma/client",
    "ws",
  ],
  typescript: { ignoreBuildErrors: true },
};

export default withPWA(nextConfig);
