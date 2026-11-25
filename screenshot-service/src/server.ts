import { createApp } from './app.ts';
import { closeBrowser, fetchPostStatus, takePostScreenshot } from './linkedin.ts';

const port = Number(process.env.PORT) || 10000;
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('ALLOWED_ORIGIN is not set. Browsers cannot read responses from this service.');
}

const app = createApp({
  allowedOrigins,
  checkStatus: fetchPostStatus,
  takeScreenshot: takePostScreenshot,
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const shutdown = () => {
  server.close();
  closeBrowser().finally(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
