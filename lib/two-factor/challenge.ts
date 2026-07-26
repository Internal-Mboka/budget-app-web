import { SignJWT, jwtVerify } from "jose";

const CHALLENGE_TTL_SECONDS = 5 * 60;
const CHALLENGE_PURPOSE = "2fa-login";

function getChallengeSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET est requis pour les défis 2FA.");
  }

  return new TextEncoder().encode(secret);
}

export async function createTwoFactorChallenge(userId: string) {
  return new SignJWT({ purpose: CHALLENGE_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_TTL_SECONDS}s`)
    .sign(getChallengeSecret());
}

export async function verifyTwoFactorChallenge(token: string) {
  try {
    const { payload } = await jwtVerify(token, getChallengeSecret(), {
      algorithms: ["HS256"],
    });

    if (payload.purpose !== CHALLENGE_PURPOSE || !payload.sub) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export const TWO_FACTOR_CHALLENGE_COOKIE = "mboka-2fa-challenge";
