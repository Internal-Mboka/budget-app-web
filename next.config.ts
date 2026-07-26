import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false,
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless", "@prisma/adapter-neon", "ws"],
};

export default withPWA(nextConfig);
