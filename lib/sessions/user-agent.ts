export type SessionClientMeta = {
  deviceType: string;
  browser: string;
  ipAddress: string;
};

export function parseSessionClientMeta(
  userAgent: string | null,
  forwardedFor: string | null,
  realIp: string | null
): SessionClientMeta {
  const ua = userAgent ?? "";
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "Inconnue";

  return {
    deviceType: detectDeviceType(ua),
    browser: detectBrowser(ua),
    ipAddress,
  };
}

function detectDeviceType(userAgent: string): string {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return "Tablette";
  }

  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)) {
    return "Mobile";
  }

  return "Ordinateur";
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) {
    return "Microsoft Edge";
  }

  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    return "Google Chrome";
  }

  if (/Firefox\//i.test(userAgent)) {
    return "Mozilla Firefox";
  }

  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    return "Safari";
  }

  if (/Electron\//i.test(userAgent)) {
    return "Electron";
  }

  return "Navigateur inconnu";
}
