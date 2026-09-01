import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '@pkg/shared/web';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/context';
import type { FormProps } from '#/components/form/types';

type FormDatePickerProps = FormProps<typeof Button> & {
  placeholder?: string
  disabled?: boolean
};

export function FormDatePicker({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  placeholder,
  disabled,
}: FormDatePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.datePlaceholder');
  const field = useFieldContext<string | undefined>();
  const [open, setOpen] = useState(false);
  const selected = field.state.value ? new Date(field.state.value + 'T00:00:00') : undefined;

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button id={field.name} type="button" variant="outline" disabled={disabled} aria-invalid={field.state.meta.errors.length > 0 || undefined} className="w-full justify-between font-normal" />}>
          {selected ? format(selected, 'yyyy-MM-dd') : <span className="text-muted-foreground">{displayPlaceholder}</span>}
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              field.handleChange(date ? format(date, 'yyyy-MM-dd') : undefined);
              field.handleBlur();
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
