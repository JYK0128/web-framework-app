export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffFactor?: number
  jitter?: boolean
  shouldRetry?: (error: unknown, attempt: number) => boolean | Promise<boolean>
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    maxDelayMs = 10000,
    backoffFactor = 2,
    jitter = false,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    }
    catch (error) {
      lastError = error;

      if (attempt >= maxRetries) {
        break;
      }

      const isRetryable = await shouldRetry(error, attempt);
      if (!isRetryable) {
        throw error;
      }

      let delay = Math.min(initialDelayMs * (backoffFactor ** attempt), maxDelayMs);

      if (jitter) {
        // eslint-disable-next-line sonarjs/pseudo-random -- non-cryptographic jitter for network backoff
        delay = Math.round(delay * (0.5 + Math.random() * 0.5));
      }

      onRetry?.(error, attempt + 1, delay);

      await sleep(delay);
    }
  }

  throw lastError;
}
