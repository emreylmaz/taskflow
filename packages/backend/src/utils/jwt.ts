import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";
import type { TokenPayload } from "@taskflow/shared";

// JWT Constants
const JWT_ISSUER = "taskflow";
const JWT_AUDIENCE = "taskflow-api";

export type { TokenPayload };

/**
 * Generate a unique JWT ID (jti) for token tracking
 */
function generateJti(): string {
  return crypto.randomUUID();
}

export function generateAccessToken(
  payload: Pick<TokenPayload, "userId" | "email">,
): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: generateJti(),
    },
  );
}

export function generateRefreshToken(
  payload: Pick<TokenPayload, "userId" | "email">,
): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: generateJti(),
    },
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as TokenPayload;

  return {
    userId: payload.userId,
    email: payload.email,
    iss: payload.iss,
    aud: payload.aud,
    jti: payload.jti,
  };
}

export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as TokenPayload;

  return {
    userId: payload.userId,
    email: payload.email,
    iss: payload.iss,
    aud: payload.aud,
    jti: payload.jti,
  };
}
