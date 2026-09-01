function quoteShellArgument(value: string): string {
  const escaped = value.replaceAll('\'', '\u0027\u0022\u0027\u0022\u0027');
  return `'${escaped}'`;
}

function serializeBody(body: RequestInit['body']): string | null {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  return null;
}

export function fetchToCurl(input: string | URL, init: RequestInit = {}): string {
  const parts = [
    'curl',
    '-X',
    (init.method ?? 'GET').toUpperCase(),
    quoteShellArgument(input.toString()),
  ];

  new Headers(init.headers).forEach((value, name) => {
    parts.push('-H', quoteShellArgument(`${name}: ${value}`));
  });

  const body = serializeBody(init.body);
  if (body !== null) parts.push('--data-raw', quoteShellArgument(body));

  return parts.join(' \\\n  ');
}
