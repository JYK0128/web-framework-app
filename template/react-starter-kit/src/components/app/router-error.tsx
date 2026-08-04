import type { ErrorComponentProps } from '@tanstack/react-router';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export function RouterError({ error }: ErrorComponentProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <main className="grid min-h-full place-items-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>문제가 발생했습니다</CardTitle>
          <CardDescription>
            페이지를 새로고침한 뒤 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorDetails message={errorMessage} />
          <Button type="button" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function ErrorDetails({ message }: Readonly<{ message: string }>) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <pre className="
      scroll max-h-40 rounded-md bg-muted text-xs whitespace-pre-wrap
    "
    >
      {message}
    </pre>
  );
}
