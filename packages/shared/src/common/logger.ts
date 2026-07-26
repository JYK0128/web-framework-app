import { consola, type ConsolaInstance, type ConsolaReporter, LogLevels, type LogObject } from 'consola';

export interface LoggerConfigOptions {
  /** Remote server endpoint URL to transmit logs to. Pass a valid URL string to enable, or null/empty to disable. (default: null) */
  endpoint?: string | null
  /** Suppress 'info' logs in browser devtools console (default: false) */
  silentInfoInBrowser?: boolean
}

// Internal state for browser logging
let currentEndpoint: string | null = null;
let isSilentInfoBrowser = false;

/**
 * Universal Consola Logger instance for Server & Browser
 */
export const logger: ConsolaInstance = consola.create({
  level: LogLevels.debug, // Debug, Info, Success, Warn, Error, Fatal
  formatOptions: {
    depth: Number.POSITIVE_INFINITY, // Expand all nested objects infinitely deep
  },
});

interface BrowserGlobals {
  window?: {
    location?: {
      href?: string
    }
  }
  navigator?: {
    userAgent?: string
    sendBeacon?: (url: string, data?: string | ArrayBufferView | null) => boolean
  }
}

/**
 * Synchronizes Consola's reporters with current configuration options (Browser only)
 */
function setBrowserReporters() {
  const g = globalThis as unknown as BrowserGlobals;
  if (typeof g.window === 'undefined') return;

  const win = g.window;
  const nav = g.navigator;

  const targetTypes = new Set(['error', 'fatal', 'info']);
  const activeReporters: ConsolaReporter[] = [];

  // 1. Browser Console Reporter (Outputs all logs; suppresses 'info' only when isSilentInfoBrowser is true)
  activeReporters.push({
    log(logObj: LogObject) {
      if (isSilentInfoBrowser && logObj.type === 'info') return;

      const method = logObj.type in console ? (logObj.type as keyof Console) : 'log';
      const consoleFn = console[method] as ((...args: unknown[]) => void) | undefined;
      if (typeof consoleFn === 'function') {
        consoleFn.apply(console, logObj.args || []);
      }
    },
  });

  // 2. Server Log Transmitter Reporter (Active when currentEndpoint is set)
  if (currentEndpoint) {
    const targetUrl = currentEndpoint;
    activeReporters.push({
      log(logObj: LogObject) {
        if (targetTypes.has(logObj.type)) {
          const payload = {
            type: logObj.type,
            tag: logObj.tag ?? '',
            message: Array.isArray(logObj.args) ? logObj.args.join(' ') : String(logObj.args),
            date: logObj.date,
            url: win?.location?.href ?? '',
            userAgent: nav?.userAgent ?? '',
          };

          if (nav && typeof nav.sendBeacon === 'function') {
            nav.sendBeacon(targetUrl, JSON.stringify(payload));
          }
        }
      },
    });
  }

  // Register configured reporters with Consola
  logger.setReporters(activeReporters);
}

/**
 * Public API: Configure global logger options at startup
 *
 * @example
 * setLoggerConfig({
 *   endpoint: '/api/logs',
 *   silentInfoInBrowser: true,
 * });
 */
export function setLoggerConfig(options: LoggerConfigOptions): void {
  if (options.endpoint !== undefined) {
    currentEndpoint = options.endpoint;
  }
  if (options.silentInfoInBrowser !== undefined) {
    isSilentInfoBrowser = options.silentInfoInBrowser;
  }

  setBrowserReporters();
}

/**
 * Creates a tagged logger instance for specific microservices or modules
 * @example
 * const userLogger = createLogger('UserService');
 * userLogger.info('User logged in'); // [UserService] User logged in
 */
export function createLogger(tag?: string): ConsolaInstance {
  return tag ? logger.withTag(tag) : logger;
}
