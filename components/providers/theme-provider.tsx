"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * React 19 interdit les balises <script> dans l'arbre client.
 * next-themes en injecte une pour éviter le flash de thème : on la garde
 * côté SSR, puis on neutralise le type côté client après hydratation.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const isClient = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  return (
    <NextThemesProvider
      {...props}
      scriptProps={isClient ? { type: "application/json" } : undefined}
    >
      {children}
    </NextThemesProvider>
  );
}
