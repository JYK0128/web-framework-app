import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function DatePicker({ value, onChange, placeholder = '날짜 선택', disabled, id, className, onBlur }: { value?: string, onChange: (value: string | undefined) => void, placeholder?: string, disabled?: boolean, id?: string, className?: string, onBlur?: () => void }) {
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
