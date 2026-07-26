import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";
import { PwaRegister } from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mboka Budget",
  description: "Plateforme de gestion financiere et operationnelle Mboka Studio",
  manifest: "/manifest.webmanifest",
  themeColor: "#10579F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mboka Budget",
  },
  icons: {
    icon: "/icon?v=3",
    apple: "/apple-icon?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <PwaRegister />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
