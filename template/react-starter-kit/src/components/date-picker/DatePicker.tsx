import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState, type WrapProps } from 'react';

import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

export type DatePickerProps = WrapProps<typeof Button, {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  onBlur?: () => void
}>;

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  className,
  onBlur,
  ...props
}: DatePickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  const displayPlaceholder = placeholder ?? t('form.datePlaceholder');

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
          ? format(selected, 'yyyy-MM-dd')
          : <span className="text-muted-foreground">{displayPlaceholder}</span>}
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : undefined);
            setOpen(false);
            onBlur?.();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
