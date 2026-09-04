function quoteShellArgument(value: string): string {
  const escaped = value.replaceAll('\'', '\'\\\'\'');
  return `'${escaped}'`;
}

function serializeBody(body: RequestInit['body']): string | null {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  return null;
}

/**
 * Converts a Fetch request (URL/Request + init) into a cURL command string.
 */
export function fetchToCurl(input: string | URL | Request, init: RequestInit = {}): string {
  let urlStr: string;
  let method: string | undefined = init.method;
  const headers = new Headers(init.headers);
  const body: RequestInit['body'] = init.body;

  if (typeof input === 'string') {
    urlStr = input;
  }
  else if (input instanceof URL) {
    urlStr = input.toString();
  }
  else {
    // input is Request instance
    urlStr = input.url;
    method ||= input.method;
    input.headers.forEach((value, name) => {
      if (!headers.has(name)) {
        headers.set(name, value);
      }
    });
  }

  const parts = [
    'curl',
    '-X',
    (method ?? 'GET').toUpperCase(),
    quoteShellArgument(urlStr),
  ];

  headers.forEach((value, name) => {
    parts.push('-H', quoteShellArgument(`${name}: ${value}`));
  });

  const serializedBody = serializeBody(body);
  if (serializedBody !== null) {
    parts.push('--data-raw', quoteShellArgument(serializedBody));
  }

  return parts.join(' \\\n  ');
}
