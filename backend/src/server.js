import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createStore } from "./data/store.js";

async function bootstrap() {
  const store = await createStore();
  const app = createApp(store);

  app.listen(env.port, () => {
    console.log(`Smart Compliance API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
