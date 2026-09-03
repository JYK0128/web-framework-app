import { valueIf, when } from '@pkg/shared/common';
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

  const selected: DateRange | undefined = when(
    (range: unknown): range is DateRangeValue & { from: string } => (
      typeof range === 'object' && range !== null && 'from' in range && typeof range.from === 'string'
    ),
    (range) => ({
      from: new Date(`${range.from}T00:00:00`),
      to: when((date): date is string => Boolean(date), (date) => new Date(`${date}T00:00:00`))(range.to),
    }),
  )(value);

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
        <span className={valueIf(!selected?.from, 'text-muted-foreground')}>{text}</span>
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          onSelect={(range) => {
            const nextValue = when(
              (range: unknown): range is DateRange & { from: Date } => (
                typeof range === 'object' && range !== null && 'from' in range && range.from instanceof Date
              ),
              (range) => ({
                from: format(range.from, 'yyyy-MM-dd'),
                to: when((date): date is Date => Boolean(date), (date) => format(date, 'yyyy-MM-dd'))(range.to),
              }),
            )(range);
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
