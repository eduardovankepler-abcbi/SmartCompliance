import assert from "node:assert/strict";
import { buildCorsOriginOption } from "../src/config/env.js";

async function resolveCors(corsOrigin, origin) {
  if (typeof corsOrigin === "string") {
    return corsOrigin === origin;
  }

  return await new Promise((resolve, reject) => {
    corsOrigin(origin, (error, allowed) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(allowed);
    });
  });
}

const originalNodeEnv = process.env.NODE_ENV;
const originalCorsOrigin = process.env.CORS_ORIGIN;
const originalCorsOrigins = process.env.CORS_ORIGINS;
const originalAdditionalOrigins = process.env.CORS_ADDITIONAL_ORIGINS;

try {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGIN = "https://smart.local";
  delete process.env.CORS_ORIGINS;
  process.env.CORS_ADDITIONAL_ORIGINS = "https://admin.smart.local";

  const productionCors = buildCorsOriginOption();
  assert.equal(await resolveCors(productionCors, "https://smart.local"), true);
  assert.equal(await resolveCors(productionCors, "https://admin.smart.local"), true);
  assert.equal(await resolveCors(productionCors, "https://smart-compliance-angular.vercel.app"), false);
  assert.equal(await resolveCors(productionCors, "https://evil.example"), false);
  assert.equal(await resolveCors(productionCors, undefined), true);

  delete process.env.CORS_ORIGIN;
  delete process.env.CORS_ADDITIONAL_ORIGINS;
  const productionWithoutExplicitOrigin = buildCorsOriginOption();
  assert.equal(await resolveCors(productionWithoutExplicitOrigin, "https://smart-compliance-angular.vercel.app"), false);

  process.env.CORS_ORIGIN = "https://https://smart-compliance-angular.vercel.app/";
  const productionCorsWithDuplicatedScheme = buildCorsOriginOption();
  assert.equal(
    await resolveCors(productionCorsWithDuplicatedScheme, "https://smart-compliance-angular.vercel.app"),
    true
  );
  assert.equal(await resolveCors(productionCorsWithDuplicatedScheme, "https://evil.example"), false);

  process.env.NODE_ENV = "development";
  const developmentCors = buildCorsOriginOption();
  assert.equal(await resolveCors(developmentCors, "https://smart-compliance-angular.vercel.app"), true);
} finally {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
  if (originalCorsOrigin === undefined) delete process.env.CORS_ORIGIN; else process.env.CORS_ORIGIN = originalCorsOrigin;
  if (originalCorsOrigins === undefined) delete process.env.CORS_ORIGINS; else process.env.CORS_ORIGINS = originalCorsOrigins;
  if (originalAdditionalOrigins === undefined) delete process.env.CORS_ADDITIONAL_ORIGINS; else process.env.CORS_ADDITIONAL_ORIGINS = originalAdditionalOrigins;
}

console.log("Security config tests passed.");
