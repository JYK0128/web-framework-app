import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { useI18n } from '@pkg/shared/web';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/context';
import type { FormProps } from '#/components/form/types';

type FormDateRangePickerProps = FormProps<typeof Button> & { placeholder?: string };

export function FormDateRangePicker({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  placeholder,
  disabled,
}: FormDateRangePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.dateRangePlaceholder');
  const field = useFieldContext<{ from?: string, to?: string } | undefined>();
  const [open, setOpen] = useState(false);
  const value = field.state.value;
  const selected: DateRange | undefined = value?.from ? { from: new Date(value.from + 'T00:00:00'), to: value.to ? new Date(value.to + 'T00:00:00') : undefined } : undefined;
  let text = displayPlaceholder;
  if (selected?.from) {
    text = format(selected.from, 'yyyy-MM-dd');
    if (selected.to) text += ' ~ ' + format(selected.to, 'yyyy-MM-dd');
  }

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button type="button" variant="outline" disabled={disabled} aria-invalid={field.state.meta.errors.length > 0 || undefined} className="w-full justify-between font-normal" />}>
          <span className={!selected?.from ? 'text-muted-foreground' : undefined}>{text}</span>
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selected}
            onSelect={(range) => {
              field.handleChange(range?.from ? { from: format(range.from, 'yyyy-MM-dd'), to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined } : undefined);
              field.handleBlur();
              if (range?.from && range.to) setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
