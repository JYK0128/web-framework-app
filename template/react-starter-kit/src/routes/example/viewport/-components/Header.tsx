import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { AppHeader } from '#/components/layout';

export interface HeaderProps {
  heightUnit: string;
  onOpenDialog?: () => void;
}

export function Header({ heightUnit, onOpenDialog }: HeaderProps) {
  return (
    <AppHeader className="z-10 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">Viewport Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          {onOpenDialog && (
            <Button
              id="btn-open-dialog-header"
              type="button"
              size="sm"
              onClick={onOpenDialog}
              className="text-xs font-semibold shadow-2xs"
            >
              💬 Dialog
            </Button>
          )}
          <Badge variant="outline" className="border-blue-200 bg-blue-50 font-mono text-xs text-blue-600 shadow-2xs">
            {heightUnit.replace('100', '')}
          </Badge>
        </div>
      </div>
    </AppHeader>
  );
}
