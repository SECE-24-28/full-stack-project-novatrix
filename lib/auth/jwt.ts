import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import type { JwtPayload } from "@/types/auth";
import type { Role } from "@prisma/client";

const encoder = new TextEncoder();
const accessSecret  = () => encoder.encode(process.env.JWT_SECRET!);
const refreshSecret = () => encoder.encode(process.env.JWT_REFRESH_SECRET!);

// ─── Sign ────────────────────────────────────────────────────────────────────

export async function signAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "15m")
    .sign(accessSecret());
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")
    .sign(refreshSecret());
}

// ─── Verify ──────────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret());
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, refreshSecret());
  return payload as { sub: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function isJwtExpiredError(err: unknown): boolean {
  return err instanceof joseErrors.JWTExpired;
}

/** Seconds until expiry from a decoded payload (0 if already expired) */
export function secondsUntilExpiry(payload: JwtPayload): number {
  if (!payload.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

/** Cookie-safe access token duration in ms */
export const ACCESS_TOKEN_MS  = 15 * 60 * 1000;
export const REFRESH_TOKEN_MS = 7  * 24 * 60 * 60 * 1000;
