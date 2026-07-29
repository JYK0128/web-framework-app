import { Badge } from '@/components/ui/badge';

export interface HeaderProps {
  heightUnit: string;
  onOpenDialog?: () => void;
}

export function Header({ heightUnit, onOpenDialog }: HeaderProps) {
  return (
    <header
      className="app-header px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-md z-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">Viewport Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          {onOpenDialog && (
            <button
              id="btn-open-dialog-header"
              onClick={onOpenDialog}
              className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-2xs"
            >
              💬 Dialog
            </button>
          )}
          <Badge variant="blue" className="font-mono text-xs shadow-2xs">
            {heightUnit.replace('100', '')}
          </Badge>
        </div>
      </div>
    </header>
  );
}
