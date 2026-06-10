import { createConfig } from "./config.js";
import { createSessionStore } from "./session-store.js";
import { createSecureStore } from "./secure-store.js";
import { createTencentDocsWorker } from "./tencent-docs-worker.js";
import { createServerApp } from "./server.js";

const config = createConfig();
const sessionStore = createSessionStore();
const secureStore = createSecureStore({
  baseDir: config.dataDir,
  secret: config.tokenSecret,
});
const worker = createTencentDocsWorker({
  loginUrl: config.loginUrl,
  browserHeadless: config.browserHeadless,
  authTimeoutMs: config.authTimeoutMs,
  captureTimeoutMs: config.captureTimeoutMs,
});
const app = createServerApp({
  config,
  sessionStore,
  worker,
  secureStore,
});

const { baseUrl, close } = await app.listen({ port: config.port });

console.log(`Tencent Docs hidden capture POC listening on ${baseUrl}`);

async function shutdown() {
  await close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
