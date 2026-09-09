import { valueIf, when } from '@pkg/shared/common';
import { format, isToday } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState, type WrapProps } from 'react';

import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

export type DatetimePickerProps = WrapProps<typeof Button, {
  value?: string | Date
  onChange: (value: string | undefined) => void
  placeholder?: string
  disablePastDates?: boolean
  onBlur?: () => void
}>;

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function DatetimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  disablePastDates,
  id,
  className,
  onBlur,
  ...props
}: DatetimePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('core.form.dateTimePlaceholder');
  const [open, setOpen] = useState(false);

  const selected = when(
    (v): v is string | Date => Boolean(v),
    (v) => (v instanceof Date ? v : new Date(v)),
  )(value);
  const isValidDate = selected instanceof Date && !isNaN(selected.getTime());
  const effectiveDate = isValidDate ? selected : undefined;

  const hour = String(effectiveDate?.getHours() ?? 0).padStart(2, '0');
  const minute = String(effectiveDate?.getMinutes() ?? 0).padStart(2, '0');

  const update = (nextDate: Date | undefined, nextHour = hour, nextMinute = minute) => {
    if (!nextDate) {
      onChange(undefined);
      return;
    }

    const nextValue = new Date(nextDate);
    nextValue.setHours(Number(nextHour), Number(nextMinute), 0, 0);
    onChange(nextValue.toISOString());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      update(undefined);
      onBlur?.();
      return;
    }

    if (disablePastDates && isToday(date)) {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const nearest5Min = Math.floor(now.getMinutes() / 5) * 5;
      const currentMinute = String(Math.min(nearest5Min, 55)).padStart(2, '0');

      const isCurrentTimeSelected = Number(hour) < now.getHours()
        || (Number(hour) === now.getHours() && Number(minute) < now.getMinutes());

      const nextHour = isCurrentTimeSelected ? currentHour : hour;
      const nextMinute = isCurrentTimeSelected ? currentMinute : minute;

      update(date, nextHour, nextMinute);
      return;
    }

    update(date);
  };

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
        {effectiveDate
          ? format(effectiveDate, 'yyyy-MM-dd HH:mm')
          : <span className="text-muted-foreground">{displayPlaceholder}</span>}
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={effectiveDate}
          onSelect={handleDateSelect}
          disabled={valueIf(Boolean(disablePastDates), { before: new Date() })}
        />
        <div className="flex items-center gap-2 border-t p-3">
          <Select
            value={hour}
            onValueChange={(nextHour) => {
              if (nextHour) {
                update(effectiveDate ?? new Date(), nextHour, minute);
                onBlur?.();
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-24" aria-label={t('core.form.hour')}>
              <SelectValue placeholder={t('core.form.hour')} />
            </SelectTrigger>
            <SelectContent>
              {hours.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="leading-none">:</span>
          <Select
            value={minute}
            onValueChange={(nextMinute) => {
              if (nextMinute) {
                update(effectiveDate ?? new Date(), hour, nextMinute);
                onBlur?.();
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-24" aria-label={t('core.form.minute')}>
              <SelectValue placeholder={t('core.form.minute')} />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
