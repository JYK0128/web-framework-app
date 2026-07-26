import { Clock3Icon } from 'lucide-react';

import { useI18n } from '@pkg/shared/web';
import { Button, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/context';
import type { FormProps } from '#/components/form/types';

type FormTimePickerProps = FormProps<typeof Button> & {
  placeholder?: string
  disabled?: boolean
};

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function FormTimePicker({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  placeholder,
  disabled,
}: FormTimePickerProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.timePlaceholder');
  const field = useFieldContext<string | undefined>();
  const [rawHour = '', rawMinute = ''] = field.state.value?.split(':') ?? [];
  const hour = rawHour || '00';
  const minute = rawMinute || '00';
  const hasValue = Boolean(field.state.value);
  const hasError = field.state.meta.errors.length > 0;
  const update = (nextHour = hour, nextMinute = minute) => field.handleChange(`${nextHour}:${nextMinute}`);

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Popover>
        <PopoverTrigger render={<Button id={field.name} type="button" variant="outline" disabled={disabled} aria-invalid={hasError || undefined} className="w-full justify-between font-normal" />}>
          {hasValue ? `${hour}:${minute}` : <span className="text-muted-foreground">{displayPlaceholder}</span>}
          <Clock3Icon />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="flex items-center gap-2 p-3">
            <Select
              value={hour}
              onValueChange={(value) => {
                update(value ?? '', minute);
                field.handleBlur();
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-24" aria-label={t('form.hour')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {hours.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                    {t('form.hour')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="leading-none">:</span>
            <Select
              value={minute}
              onValueChange={(value) => {
                update(hour, value ?? '');
                field.handleBlur();
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-24" aria-label={t('form.minute')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {minutes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                    {t('form.minute')}
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
