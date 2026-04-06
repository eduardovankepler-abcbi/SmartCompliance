import crypto from "crypto";

export const createId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const hashPassword = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

export function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left || "", "utf8");
  const rightBuffer = Buffer.from(right || "", "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPasswordHash(storedHash, password) {
  if (!storedHash) {
    return false;
  }

  if (storedHash.startsWith("pbkdf2$")) {
    const [, iterationsRaw, salt, expectedHash] = storedHash.split("$");
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !expectedHash) {
      return false;
    }

    const derivedHash = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    return safeCompare(derivedHash, expectedHash);
  }

  return safeCompare(hashPassword(password), storedHash);
}
