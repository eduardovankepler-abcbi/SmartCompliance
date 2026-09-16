import crypto from "crypto";
import { env } from "../config/env.js";
import { verifyPasswordHash } from "../data/storeSecurity.js";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(payloadPart) {
  return crypto
    .createHmac("sha256", env.authSecret)
    .update(payloadPart)
    .digest("base64url");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left || "", "utf8");
  const rightBuffer = Buffer.from(right || "", "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createToken(payload) {
  const body = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 12
  };
  const encodedPayload = encode(body);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function credentialVersion(passwordHash) {
  return sign(`credential:${String(passwordHash)}`);
}

export async function createUserToken(store, user, authenticatedPassword) {
  const credentials = await store.findUserByEmail(user.email);
  if (!credentials || credentials.id !== user.id || credentials.status !== "active") {
    throw new Error("Usuario indisponivel para iniciar sessao.");
  }
  // Uma redefinicao concorrente nao pode transformar um login antigo em sessao nova.
  if (authenticatedPassword !== undefined && !verifyPasswordHash(credentials.passwordHash, authenticatedPassword)) {
    throw new Error("Credenciais alteradas durante a autenticacao. Entre novamente.");
  }
  return createToken({ userId: user.id, credentialVersion: credentialVersion(credentials.passwordHash) });
}

export function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature || !safeCompare(sign(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = decode(encodedPayload);
    if (!payload?.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
