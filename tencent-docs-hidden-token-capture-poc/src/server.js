import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

function toFsPath(value) {
  if (value instanceof URL) {
    return fileURLToPath(value);
  }
  return value;
}

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(response, filePath, contentType) {
  const body = await fs.readFile(filePath);
  response.writeHead(200, {
    "content-type": contentType,
  });
  response.end(body);
}

export function createServerApp({
  config,
  sessionStore,
  worker,
  secureStore,
}) {
  const publicDir = toFsPath(config.publicDir);
  const activeSessionIds = new Set();
  const captureJobs = new Map();

  function runCaptureForSession(sessionId, loginUrl) {
    if (captureJobs.has(sessionId)) {
      return captureJobs.get(sessionId);
    }

    const job = (async () => {
      try {
        const capture = await worker.finalizeSession({
          sessionId,
          targetUrl: loginUrl,
        });
        await secureStore.saveToken({
          sessionId,
          token: capture.token,
          source: "background_capture",
        });
        return sessionStore.updateSession(sessionId, {
          status: "captured",
          tokenLast4: capture.tokenLast4,
          copiedText: capture.copiedText,
          error: null,
        });
      } catch (error) {
        return sessionStore.updateSession(sessionId, {
          status: "failed",
          error: error.message,
        });
      } finally {
        captureJobs.delete(sessionId);
        activeSessionIds.delete(sessionId);
        await worker.closeSession(sessionId);
      }
    })();

    captureJobs.set(sessionId, job);
    return job;
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");

      if (request.method === "GET" && url.pathname === "/") {
        await serveStatic(
          response,
          path.join(publicDir, "index.html"),
          "text/html; charset=utf-8"
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/app.js") {
        await serveStatic(
          response,
          path.join(publicDir, "app.js"),
          "application/javascript; charset=utf-8"
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/styles.css") {
        await serveStatic(
          response,
          path.join(publicDir, "styles.css"),
          "text/css; charset=utf-8"
        );
        return;
      }

      if (request.method === "GET" && url.pathname === "/favicon.ico") {
        response.writeHead(204);
        response.end();
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/sessions") {
        const body = await readJsonBody(request);
        const id = crypto.randomUUID();
        const loginUrl = body.loginUrl || config.loginUrl;
        const session = sessionStore.createSession({ id, loginUrl });
        activeSessionIds.add(id);
        await worker.startSession({ sessionId: id, targetUrl: loginUrl });
        if (config.autoCaptureOnCreate) {
          void runCaptureForSession(id, loginUrl);
        }
        jsonResponse(response, 201, session);
        return;
      }

      const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
      if (request.method === "GET" && sessionMatch) {
        const session = sessionStore.getSession(sessionMatch[1]);
        if (!session) {
          jsonResponse(response, 404, { error: "Session not found" });
          return;
        }
        jsonResponse(response, 200, session);
        return;
      }

      const finalizeMatch = url.pathname.match(
        /^\/api\/sessions\/([^/]+)\/finalize$/
      );
      if (request.method === "POST" && finalizeMatch) {
        const sessionId = finalizeMatch[1];
        const existing = sessionStore.getSession(sessionId);
        if (!existing) {
          jsonResponse(response, 404, { error: "Session not found" });
          return;
        }

        const updated = await runCaptureForSession(sessionId, existing.loginUrl);
        jsonResponse(response, updated.status === "failed" ? 500 : 200, updated);
        return;
      }

      jsonResponse(response, 404, { error: "Not found" });
    } catch (error) {
      jsonResponse(response, 500, {
        error: error.message,
      });
    }
  });

  return {
    async listen({ port = 0 } = {}) {
      await new Promise((resolve) => {
        server.listen(port, "127.0.0.1", resolve);
      });

      const address = server.address();
      const baseUrl = `http://127.0.0.1:${address.port}`;

      return {
        baseUrl,
        close: async () => {
          for (const sessionId of activeSessionIds) {
            await worker.closeSession(sessionId);
          }
          await Promise.allSettled(captureJobs.values());
          await new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }
              resolve();
            });
          });
        },
      };
    },
  };
}
