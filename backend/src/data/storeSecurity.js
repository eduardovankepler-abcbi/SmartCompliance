import crypto from "crypto";

export const createId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 600000;
  const derived = crypto.pbkdf2Sync(value, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2-v2$${iterations}$${salt}$${derived}`;
}

export function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPasswordHash(storedHash, password) {
  if (!storedHash || typeof password !== "string") {
    return false;
  }

  const normalizedHash = Buffer.isBuffer(storedHash)
    ? storedHash.toString("utf8")
    : String(storedHash);

  if (normalizedHash.startsWith("pbkdf2$") || normalizedHash.startsWith("pbkdf2-v2$")) {
    const [, iterationsRaw, salt, expectedHash] = normalizedHash.split("$");
    const iterations = Number(iterationsRaw);
    const modern = normalizedHash.startsWith("pbkdf2-v2$");
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > 2000000 || !salt ||
        !new RegExp(`^[a-f0-9]{${modern ? 64 : 128}}$`, "i").test(expectedHash || "")) {
      return false;
    }

    const derivedHash = crypto
      .pbkdf2Sync(password, salt, iterations, modern ? 32 : 64, modern ? "sha256" : "sha512")
      .toString("hex");

    return safeCompare(derivedHash, expectedHash);
  }

  return safeCompare(crypto.createHash("sha256").update(password).digest("hex"), normalizedHash);
}
