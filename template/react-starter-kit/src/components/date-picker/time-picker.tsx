import { Clock3Icon } from 'lucide-react';
import { type WrapProps } from 'react';

import { Button, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

export type TimePickerProps = WrapProps<typeof Button, {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  onBlur?: () => void
}>;

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  className,
  onBlur,
  ...props
}: TimePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('core.form.timePlaceholder');
  const [rawHour = '', rawMinute = ''] = value?.split(':') ?? [];
  const hour = rawHour || '00';
  const minute = rawMinute || '00';
  const hasValue = Boolean(value);

  const update = (nextHour = hour, nextMinute = minute) => {
    onChange(`${nextHour}:${nextMinute}`);
    onBlur?.();
  };

  return (
    <Popover>
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
        {hasValue
          ? `${hour}:${minute}`
          : (
            <span className="text-muted-foreground">
              {displayPlaceholder}
            </span>
          )}
        <Clock3Icon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex items-center gap-2 p-3">
          <Select
            value={hour}
            onValueChange={(nextHour) => update(nextHour ?? '', minute)}
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
            onValueChange={(nextMinute) => update(hour, nextMinute ?? '')}
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
