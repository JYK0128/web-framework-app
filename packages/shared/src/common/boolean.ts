const TRUTHY_SET = new Set(['1', 'true', 'yes', 'on', 'granted', 't', 'y']);
const FALSY_SET = new Set(['0', 'false', 'no', 'off', 'denied', 'f', 'n']);

export function toBoolean<T extends boolean | null = null>(
  value: unknown,
  defaultValue: T = null as T,
): boolean | T {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (TRUTHY_SET.has(normalized)) return true;
    if (FALSY_SET.has(normalized)) return false;
  }

  return defaultValue;
}
