import { headers } from "next/headers";

import { parseSessionClientMeta } from "@/lib/sessions/user-agent";

export type AuditRequestMeta = {
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  browser: string;
};

export async function readAuditRequestMeta(): Promise<AuditRequestMeta> {
  const headerList = await headers();
  const parsed = parseSessionClientMeta(
    headerList.get("user-agent"),
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip")
  );

  return {
    ipAddress: parsed.ipAddress,
    userAgent: headerList.get("user-agent") ?? "Inconnu",
    deviceType: parsed.deviceType,
    browser: parsed.browser,
  };
}
