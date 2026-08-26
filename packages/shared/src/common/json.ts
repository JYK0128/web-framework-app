const SUSPECT_PROTO_RX = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
const SUSPECT_CONSTRUCTOR_RX = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;

declare global {
  interface JSON {
    safeParse<T = unknown>(value: unknown): T | null
  }
}

function safeReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (Object.prototype.hasOwnProperty.call(value, '__proto__')) {
      Reflect.deleteProperty(value, '__proto__');
    }
    if (Object.prototype.hasOwnProperty.call(value, 'constructor')) {
      Reflect.deleteProperty(value, 'constructor');
    }
  }
  return value;
}

function safeJsonParse<T = unknown>(value: unknown): T | null {
  if (typeof value !== 'string') {
    return value === null || value === undefined ? null : value as T;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasSuspectProto = SUSPECT_PROTO_RX.test(trimmed) || SUSPECT_CONSTRUCTOR_RX.test(trimmed);

  try {
    const parsed: unknown = hasSuspectProto
      ? JSON.parse(trimmed, safeReviver)
      : JSON.parse(trimmed);
    return parsed as T;
  }
  catch {
    return null;
  }
}

if (typeof JSON !== 'undefined' && !JSON.safeParse) {
  JSON.safeParse = safeJsonParse;
}

export {};
