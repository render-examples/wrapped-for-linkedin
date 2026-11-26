type ShutdownOptions = {
  server: { close: (callback: () => void) => void };
  closeBrowser: () => Promise<void>;
  exit: (code: number) => void;
  // Exit with code 1 if the shutdown takes longer than this.
  timeoutMs: number;
};

/**
 * Create a signal handler that stops new requests, waits for open requests,
 * closes the browser, and then exits. A second signal does nothing.
 */
export function createShutdown({ server, closeBrowser, exit, timeoutMs }: ShutdownOptions) {
  let started = false;
  return () => {
    if (started) {
      return;
    }
    started = true;
    const timer = setTimeout(() => exit(1), timeoutMs);
    server.close(() => {
      closeBrowser()
        .catch(() => {})
        .finally(() => {
          clearTimeout(timer);
          exit(0);
        });
    });
  };
}
