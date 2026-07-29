import { cn } from '@/lib/utils';

export interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  cols?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  cols,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'grid gap-1 bg-muted/80 p-1 rounded-xl border border-border/40 shadow-inner',
        cols ?? (options.length === 5 ? 'grid-cols-5' : options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'),
      )}
    >
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'py-1 px-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-center whitespace-pre-line leading-tight flex items-center justify-center min-h-8',
            value === id
              ? 'bg-background text-foreground font-semibold shadow-xs border border-border/50'
              : 'text-muted-foreground hover:text-foreground bg-transparent',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
