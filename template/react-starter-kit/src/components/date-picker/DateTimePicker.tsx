import { format, isToday } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState, type WrapProps } from 'react';

import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

export type DateTimePickerProps = WrapProps<typeof Button, {
  value?: Date
  onChange: (value: Date | undefined) => void
  placeholder?: string
  disablePastDates?: boolean
  onBlur?: () => void
}>;

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  disablePastDates,
  id,
  className,
  onBlur,
  ...props
}: DateTimePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.dateTimePlaceholder');
  const [open, setOpen] = useState(false);

  const selected = value;
  const hour = String(selected?.getHours() ?? 0).padStart(2, '0');
  const minute = String(selected?.getMinutes() ?? 0).padStart(2, '0');

  const update = (nextDate: Date | undefined, nextHour = hour, nextMinute = minute) => {
    if (!nextDate) {
      onChange(undefined);
      return;
    }

    const nextValue = new Date(nextDate);
    nextValue.setHours(Number(nextHour), Number(nextMinute), 0, 0);
    onChange(nextValue);
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
        {selected
          ? format(selected, 'yyyy-MM-dd HH:mm')
          : <span className="text-muted-foreground">{displayPlaceholder}</span>}
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDateSelect}
          disabled={valueIf(disablePastDates, { before: new Date() })}
        />
        <div className="flex items-center gap-2 border-t p-3">
          <Select
            value={hour}
            onValueChange={(nextHour) => {
              if (nextHour) {
                update(selected ?? new Date(), nextHour, minute);
                onBlur?.();
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-24" aria-label={t('form.hour')}>
              <SelectValue placeholder={t('form.hour')} />
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
                update(selected ?? new Date(), hour, nextMinute);
                onBlur?.();
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-24" aria-label={t('form.minute')}>
              <SelectValue placeholder={t('form.minute')} />
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
