import type { ComponentProps } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormSelectProps = FormProps<typeof SelectTrigger>
  & Pick<ComponentProps<typeof Select>, 'onValueChange'>
  & Pick<ComponentProps<typeof SelectValue>, 'placeholder'>
  & {
    options?: readonly FormOption[]
  };

export function FormSelect({
  label,
  description,
  placeholder = '선택하세요',
  options = [],
  orientation,
  showError,
  labelWidth,
  required,
  onBlur,
  onValueChange,
  disabled,
  ...triggerProps
}: FormSelectProps) {
  const field = useFieldContext<string | null>();

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Select
        items={options}
        value={field.state.value}
        disabled={disabled}
        onValueChange={(value, eventDetails) => {
          field.handleChange(value);
          onValueChange?.(value, eventDetails);
        }}
      >
        <SelectTrigger
          {...triggerProps}
          id={field.name}
          style={{ ...triggerProps.style, ...getFieldAnchorStyle(field.name) }}
          className={cn('anchor-name-field w-full', triggerProps.className)}
          disabled={disabled}
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          onBlur={(event) => {
            field.handleBlur();
            onBlur?.(event);
          }}
        >
          <SelectValue className="block! min-w-0 flex-1 truncate" placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
