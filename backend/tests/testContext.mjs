import { createApp } from "../src/app.js";
import { createUserToken } from "../src/auth/token.js";
import { createStore } from "../src/data/store.js";

async function getAuthHeader(store, userId) {
  return {
    Authorization: `Bearer ${await createUserToken(store, await store.getUserById(userId))}`
  };
}

async function fetchJson(baseUrl, path, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: await headers
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function sendJson(baseUrl, path, { method = "POST", headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...await headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export async function createTestContext() {
  const store = await createStore();
  const app = createApp(store);
  const server = app.listen(0);
  const address = server.address();
  const baseUrl =
    typeof address === "object" && address?.port
      ? `http://127.0.0.1:${address.port}`
      : "";

  return {
    app,
    baseUrl,
    fetchJson: (path, headers = {}) => fetchJson(baseUrl, path, headers),
    getAuthHeader: (userId) => getAuthHeader(store, userId),
    sendJson: (path, options = {}) => sendJson(baseUrl, path, options),
    server,
    store,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
}
