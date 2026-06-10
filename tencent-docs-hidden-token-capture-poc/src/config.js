import path from "node:path";

const DEFAULT_LOGIN_URL = "https://docs.qq.com/scenario/open-claw.html?nlc=1";

export function createConfig(env = process.env) {
  return {
    port: Number(env.PORT || 4310),
    dataDir: env.TDOC_DATA_DIR || path.resolve(process.cwd(), "data"),
    publicDir: env.TDOC_PUBLIC_DIR || path.resolve(process.cwd(), "public"),
    tokenSecret:
      env.TDOC_TOKEN_SECRET || "development-secret-change-me-32-chars",
    loginUrl: env.TDOC_LOGIN_URL || DEFAULT_LOGIN_URL,
    autoCaptureOnCreate: env.TDOC_AUTO_CAPTURE_ON_CREATE !== "false",
    browserHeadless: env.TDOC_HEADLESS === "true",
    authTimeoutMs: Number(env.TDOC_AUTH_TIMEOUT_MS || 300000),
    captureTimeoutMs: Number(env.TDOC_CAPTURE_TIMEOUT_MS || 60000),
  };
}
