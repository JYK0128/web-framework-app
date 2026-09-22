import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function DatetimePicker({ value, onChange, placeholder = '일시 선택', disabled, id, className, onBlur }: { value?: string, onChange: (value: string | undefined) => void, placeholder?: string, disabled?: boolean, id?: string, className?: string, onBlur?: () => void }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;
  const validDate = selected && !Number.isNaN(selected.getTime()) ? selected : undefined;
  const hour = String(validDate?.getHours() ?? 0).padStart(2, '0');
  const minute = String(validDate?.getMinutes() ?? 0).padStart(2, '0');
  const update = (date: Date | undefined, nextHour = hour, nextMinute = minute) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    const next = new Date(date);
    next.setHours(Number(nextHour), Number(nextMinute), 0, 0);
    onChange(next.toISOString());
    onBlur?.();
  };
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
        {validDate
          ? format(validDate, 'yyyy-MM-dd HH:mm')
          : (
            <span className="text-muted-foreground">
              {placeholder}
            </span>
          )}
        <CalendarIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={validDate} onSelect={(date) => update(date)} />
        <div className="flex items-center gap-2 border-t p-3">
          <Select value={hour} onValueChange={(next) => update(validDate ?? new Date(), next ?? hour, minute)} disabled={disabled}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{hours.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <span>:</span>
          <Select value={minute} onValueChange={(next) => update(validDate ?? new Date(), hour, next ?? minute)} disabled={disabled}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{minutes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
