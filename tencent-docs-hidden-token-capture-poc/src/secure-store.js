import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function deriveKey(secret) {
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptPayload(payload, secret) {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decryptPayload(record, secret) {
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(record.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(record.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8"));
}

export function createSecureStore({ baseDir, secret }) {
  if (!baseDir) {
    throw new Error("baseDir is required");
  }
  if (!secret) {
    throw new Error("secret is required");
  }

  return {
    async saveToken({ sessionId, token, source }) {
      await fs.mkdir(baseDir, { recursive: true });

      const tokenLast4 = token.slice(-4);
      const payload = {
        token,
        tokenLast4,
        source,
      };
      const encrypted = encryptPayload(payload, secret);
      const filePath = path.join(baseDir, `${sessionId}.json`);

      await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2));

      return {
        sessionId,
        tokenLast4,
        filePath,
      };
    },

    async loadToken(sessionId) {
      const filePath = path.join(baseDir, `${sessionId}.json`);
      const raw = await fs.readFile(filePath, "utf8");
      const encrypted = JSON.parse(raw);
      return decryptPayload(encrypted, secret);
    },
  };
}
