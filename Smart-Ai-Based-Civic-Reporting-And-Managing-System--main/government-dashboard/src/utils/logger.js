const toPayload = (message, meta) => ({
  message,
  ...(meta ? { meta } : {}),
  timestamp: new Date().toISOString(),
});

export function logInfo(message, meta) {
  console.info('[INFO]', toPayload(message, meta));
}

export function logWarning(message, meta) {
  console.warn('[WARN]', toPayload(message, meta));
}

export function logError(message, meta) {
  console.error('[ERROR]', toPayload(message, meta));
}
