export function toError(value: unknown, fallbackMessage: string): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string' && value) return new Error(value);
  return new Error(fallbackMessage);
}

export function getErrorMessage(value: unknown, fallbackMessage: string): string {
  return toError(value, fallbackMessage).message;
}
