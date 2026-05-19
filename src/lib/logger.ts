const isDev = __DEV__;

function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(`[LOG] ${formatArgs(args)}`);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(`[INFO] ${formatArgs(args)}`);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(`[WARN] ${formatArgs(args)}`);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors (even in production for crash reporting)
    console.error(`[ERROR] ${formatArgs(args)}`);
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(`[DEBUG] ${formatArgs(args)}`);
    }
  },
};
