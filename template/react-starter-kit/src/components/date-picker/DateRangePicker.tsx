import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState, type WrapProps } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

export type DateRangeValue = { from?: string, to?: string };

export type DateRangePickerProps = WrapProps<typeof Button, {
  value?: DateRangeValue
  onChange: (value: DateRangeValue | undefined) => void
  placeholder?: string
  onBlur?: () => void
}>;

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  className,
  onBlur,
  ...props
}: DateRangePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.dateRangePlaceholder');
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined = value?.from
    ? {
      from: new Date(`${value.from}T00:00:00`),
      to: value.to ? new Date(`${value.to}T00:00:00`) : undefined,
    }
    : undefined;

  let text = displayPlaceholder;
  if (selected?.from) {
    text = format(selected.from, 'yyyy-MM-dd');
    if (selected.to) text += ' ~ ' + format(selected.to, 'yyyy-MM-dd');
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) onBlur?.();
      }}
    >
      <PopoverTrigger
        render={(
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            onBlur={onBlur}
            {...props}
            className={cn('w-full justify-between font-normal', className)}
          />
        )}
      >
        <span className={!selected?.from ? 'text-muted-foreground' : undefined}>{text}</span>
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          onSelect={(range) => {
            const nextValue = range?.from
              ? {
                from: format(range.from, 'yyyy-MM-dd'),
                to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
              }
              : undefined;
            onChange(nextValue);
            if (range?.from && range.to) {
              setOpen(false);
              onBlur?.();
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
