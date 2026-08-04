import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createStore } from "./data/store.js";
import { logger } from "./observability/logger.js";

async function bootstrap() {
  const store = await createStore();
  const app = createApp(store);

  app.listen(env.port, () => {
    logger.info("server.started", {
      port: env.port,
      storageMode: env.storageMode
    });
  });
}

bootstrap().catch((error) => {
  logger.error("server.start_failed", { error });
  process.exit(1);
});
