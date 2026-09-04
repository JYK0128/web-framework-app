import { Card, CardContent, Spinner } from '#/.generated/shadcn/components/ui';

export function LoadingRouter() {
  return (
    <div
      className="
        fixed inset-0 z-50 grid place-items-center bg-background/80 p-6
        backdrop-blur-sm
      "
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Card className="w-fit">
        <CardContent className="flex items-center gap-3 px-5 py-4">
          <Spinner className="size-5" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}
