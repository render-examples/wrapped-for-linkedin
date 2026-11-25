import { createApp } from './app.ts';
import { closeBrowser, fetchPostStatus, takePostScreenshot } from './linkedin.ts';
import { createShutdown } from './shutdown.ts';

// Render waits 30 seconds after SIGTERM before it stops the process.
const SHUTDOWN_TIMEOUT_MS = 25_000;

const port = Number(process.env.PORT) || 10000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('ALLOWED_ORIGINS is not set. Browsers cannot read responses from this service.');
}

const app = createApp({
  allowedOrigins,
  checkStatus: fetchPostStatus,
  takeScreenshot: takePostScreenshot,
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const shutdown = createShutdown({
  server,
  closeBrowser,
  exit: (code) => process.exit(code),
  timeoutMs: SHUTDOWN_TIMEOUT_MS,
});
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
