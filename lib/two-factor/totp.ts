import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "Mboka Budget";

export function createTotpSecret() {
  return generateSecret();
}

export function buildTotpUri(email: string, secret: string) {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  });
}

export async function createTotpQrDataUrl(email: string, secret: string) {
  const uri = buildTotpUri(email, secret);
  return QRCode.toDataURL(uri);
}

export function verifyTotpCode(code: string, secret: string) {
  try {
    const result = verifySync({ token: code, secret });
    return result.valid;
  } catch {
    return false;
  }
}
