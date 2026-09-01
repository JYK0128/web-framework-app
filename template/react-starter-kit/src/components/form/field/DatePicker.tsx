import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '@pkg/shared/web';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';

type DatePickerProps = {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  className?: string
};

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  'aria-label': ariaLabel,
  className,
}: DatePickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  const displayPlaceholder = placeholder ?? t('form.datePlaceholder');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={['w-full justify-between font-normal', className].filter(Boolean).join(' ')}
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
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
