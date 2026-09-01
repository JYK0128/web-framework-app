import { consola, type ConsolaInstance, type ConsolaReporter, LogLevels, type LogObject } from 'consola';

import { maskData } from './masking';

export interface LoggerConfigOptions {
  endpoint?: string | null
  silentInfoInBrowser?: boolean
}

interface NodeGlobals {
  process?: {
    env?: Record<string, string | undefined>
    stdout?: { write: (str: string) => void }
  }
}

function getNodeGlobals(): NodeGlobals {
  return globalThis as unknown as NodeGlobals;
}

/** ANSI 색상 이스케이프 코드(\u001b[...) 제거 헬퍼 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001B\[[0-9;]*m/gi, '');
}

// 1. PII 마스킹 전처리기
const sanitizingReporter: ConsolaReporter = {
  log(logObj: LogObject) {
    if (logObj.args) {
      logObj.args = logObj.args.map((arg) => maskData(arg));
    }
  },
};

// 2. 비개발(운영/스테이징) 서버용 1줄 JSON 출력 리포터 (Log Aggregator 전용)
const jsonReporter: ConsolaReporter = {
  log(logObj: LogObject) {
    const meta = logObj.args?.find(
      (a): a is Record<string, unknown> => typeof a === 'object' && a !== null && !Array.isArray(a),
    );
    const rawMessage = logObj.args?.find((a) => typeof a === 'string') || '';

    const payload = {
      timestamp: logObj.date ? logObj.date.toISOString() : new Date().toISOString(),
      level: logObj.type,
      tag: logObj.tag || undefined,
      message: stripAnsi(rawMessage),
      ...(meta || {}),
    };

    const proc = getNodeGlobals().process;
    if (proc?.stdout?.write) {
      proc.stdout.write(`${JSON.stringify(payload)}\n`);
    }
  },
};

// 3. 로거 인스턴스 생성
export const logger: ConsolaInstance = consola.create({
  level: LogLevels.debug,
  formatOptions: {
    depth: Number.POSITIVE_INFINITY,
    compact: true,
    breakLength: Number.POSITIVE_INFINITY,
    colors: true,
  },
});

// 4. 리포터 바인딩 (서버/컨테이너 환경: 1줄 표준 JSON 출력)
const isServer = typeof (globalThis as { window?: unknown }).window === 'undefined';
logger.setReporters(
  isServer
    ? [sanitizingReporter, jsonReporter]
    : [sanitizingReporter, ...logger.options.reporters],
);

// 5. Public APIs
export function setLoggerConfig(_options: LoggerConfigOptions): void {}

export function createLogger(tag?: string): ConsolaInstance {
  return tag ? logger.withTag(tag) : logger;
}
