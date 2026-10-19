import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '#.generated/shadcn/lib/utils';
import { useI18n } from '#context/i18n';
import { Button } from '#ui';

import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function DatePicker({ value, onChange, placeholder: placeholderProp, disabled, id, className, onBlur }: { value?: string, onChange: (value: string | undefined) => void, placeholder?: string, disabled?: boolean, id?: string, className?: string, onBlur?: () => void }) {
  const { t } = useI18n();
  const placeholder = placeholderProp ?? t('core.form.datePlaceholder');
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) onBlur?.();
      }}
    >
      <PopoverTrigger render={(
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(`w-full justify-between font-normal`, className)}
        />
      )}
      >
        {selected && !Number.isNaN(selected.getTime())
          ? format(selected, 'yyyy-MM-dd')
          : (
            <span className="text-muted-foreground">
              {placeholder}
            </span>
          )}
        <CalendarIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
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
