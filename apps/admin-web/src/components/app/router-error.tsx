import { type ErrorComponentProps, Link } from '@tanstack/react-router';
import { AlertTriangle, Copy, Home, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export function RouterError({ error, reset }: Partial<ErrorComponentProps<unknown>> & { error: unknown }) {
  const message = getErrorMessage(error);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('오류 내용이 복사되었습니다.');
    }
    catch {
      toast.error('오류 내용을 복사하지 못했습니다.');
    }
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <AlertTriangle className="size-8 text-destructive" />
            <CardTitle>페이지를 불러오지 못했습니다</CardTitle>
            <CardDescription>잠시 후 다시 시도하거나 오류 내용을 복사해 운영자에게 전달해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="
                max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md
                bg-muted p-3 pr-11 text-xs text-muted-foreground
              "
              >
                {message}
              </pre>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute right-1.5 top-1.5 text-muted-foreground"
                onClick={() => void handleCopy()}
                disabled={!message}
                aria-label="오류 내용 복사"
                title="오류 내용 복사"
              >
                <Copy />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                if (reset) reset();
                else window.location.reload();
              }}
            >
              <RefreshCw />
              {' '}
              다시 시도
            </Button>
            <Button className="flex-1" variant="outline" render={<Link to="/" />}>
              <Home />
              {' '}
              홈으로
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error) return JSON.stringify(error);
  return '알 수 없는 오류가 발생했습니다.';
}
