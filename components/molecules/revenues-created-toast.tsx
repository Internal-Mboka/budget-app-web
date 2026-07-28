"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function RevenuesCreatedToast() {
  const searchParams = useSearchParams();
  const createdCode = searchParams.get("created");

  useEffect(() => {
    if (!createdCode) {
      return;
    }

    toast.success(`Revenu ${createdCode} enregistré.`);

    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [createdCode]);

  return null;
}
