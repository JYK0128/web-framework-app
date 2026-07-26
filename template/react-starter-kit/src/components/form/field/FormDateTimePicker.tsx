import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { m } from '#.generated/paraglide/messages';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#.generated/shadcn/components/ui';
import { FormField } from '#components/form/components';
import { useFieldContext } from '#components/form/context';
import type { FormProps } from '#components/form/types';

type FormDateTimePickerProps = FormProps<typeof Button> & {
  placeholder?: string
  disabled?: boolean
};

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function FormDateTimePicker({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  placeholder = m.date_time_picker_placeholder(),
  disabled,
}: FormDateTimePickerProps) {
  const field = useFieldContext<string | undefined>();
  const [open, setOpen] = useState(false);
  const [datePart = '', timePart = ''] = field.state.value?.split('T') ?? [];
  const selected = datePart ? new Date(`${datePart}T00:00:00`) : undefined;
  const [hour = '00', minute = '00'] = timePart.split(':');
  const hasError = field.state.meta.errors.length > 0;
  const update = (nextDate = datePart, nextHour = hour, nextMinute = minute) => {
    field.handleChange(nextDate ? `${nextDate}T${nextHour}:${nextMinute}` : undefined);
  };

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={(
          <Button
            id={field.name}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={hasError || undefined}
            className="w-full justify-between font-normal"
          />
        )}
        >
          {selected
            ? `${format(selected, 'yyyy-MM-dd')} ${hour}:${minute}`
            : (
              <span className="text-muted-foreground">
                {placeholder}
              </span>
            )}
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              update(date ? format(date, 'yyyy-MM-dd') : '');
              field.handleBlur();
            }}
          />
          <div className="flex items-center gap-2 border-t p-3">
            <Select
              value={hour}
              onValueChange={(value) => {
                update(datePart, value ?? '', minute);
                field.handleBlur();
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-24" aria-label={m.hour_unit()}><SelectValue /></SelectTrigger>
              <SelectContent>
                {hours.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                    {m.hour_unit()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="leading-none">:</span>
            <Select
              value={minute}
              onValueChange={(value) => {
                update(datePart, hour, value ?? '');
                field.handleBlur();
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-24" aria-label={m.minute_unit()}><SelectValue /></SelectTrigger>
              <SelectContent>
                {minutes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                    {m.minute_unit()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
