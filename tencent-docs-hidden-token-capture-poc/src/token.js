const INSTALL_COMMAND_TOKEN_PATTERN = /TENCENT_DOCS_TOKEN="([^"]+)"/;
const BARE_TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]{24,}$/;
const LABELLED_TOKEN_PATTERN = /(token:\s*)([A-Za-z0-9._~+/=-]{24,})/gi;
const LONG_SECRET_PATTERN = /([A-Za-z0-9._~+/=-]{24,})/g;

export function extractTokenFromText(text) {
  if (typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const commandMatch = trimmed.match(INSTALL_COMMAND_TOKEN_PATTERN);
  if (commandMatch) {
    return commandMatch[1];
  }

  if (BARE_TOKEN_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const labelledMatch = trimmed.match(LABELLED_TOKEN_PATTERN);
  if (labelledMatch) {
    return labelledMatch[0].replace(/^token:\s*/i, "");
  }

  return null;
}

export function redactSecrets(text) {
  if (typeof text !== "string") {
    return text;
  }

  return text
    .replace(INSTALL_COMMAND_TOKEN_PATTERN, 'TENCENT_DOCS_TOKEN="<redacted>"')
    .replace(LABELLED_TOKEN_PATTERN, "$1<redacted>")
    .replace(LONG_SECRET_PATTERN, (value) =>
      BARE_TOKEN_PATTERN.test(value) ? "<redacted>" : value
    );
}
