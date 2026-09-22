import { Clock3Icon } from 'lucide-react';
import { useState } from 'react';

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimePicker({ value, onChange, placeholder = '시간 선택', disabled, id, className, onBlur }: { value?: string, onChange: (value: string | undefined) => void, placeholder?: string, disabled?: boolean, id?: string, className?: string, onBlur?: () => void }) {
  const [open, setOpen] = useState(false);
  const [hour = '00', minute = '00'] = value?.split(':') ?? [];
  const update = (nextHour = hour, nextMinute = minute) => {
    onChange(`${nextHour}:${nextMinute}`);
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
        {value ? `${hour}:${minute}` : <span className="text-muted-foreground">{placeholder}</span>}
        <Clock3Icon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex items-center gap-2">
          <Select value={hour} onValueChange={(next) => update(next ?? '', minute)} disabled={disabled}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{hours.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <span>:</span>
          <Select value={minute} onValueChange={(next) => update(hour, next ?? '')} disabled={disabled}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{minutes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
