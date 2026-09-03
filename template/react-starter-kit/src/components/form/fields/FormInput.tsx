import { valueIf } from '@pkg/shared/common';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Input, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormInputProps = FormProps<typeof Input> & {
  leftSide?: React.ReactNode
  rightSide?: React.ReactNode
  topSide?: React.ReactNode
  bottomSide?: React.ReactNode
};

export function FormInput({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  leftSide,
  rightSide,
  topSide,
  bottomSide,
  type,
  ...props
}: FormInputProps) {
  const field = useFieldContext<string | number | readonly string[]>();
  const hasError = field.state.meta.errors.length > 0;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const effectiveAutoComplete = props.autoComplete ?? valueIf(isPassword, 'current-password');

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <InputGroup>
        {topSide && <InputGroupAddon align="block-start">{topSide}</InputGroupAddon>}
        {leftSide && <InputGroupAddon align="inline-start">{leftSide}</InputGroupAddon>}
        <InputGroupInput
          {...props}
          autoComplete={effectiveAutoComplete}
          id={field.name}
          name={field.name}
          type={effectiveType}
          value={field.state.value}
          aria-invalid={hasError || undefined}
          onBlur={(event) => {
            props.onBlur?.(event);
            field.handleBlur();
          }}
          onChange={(event) => {
            props.onChange?.(event);
            field.handleChange(
              type === 'number'
                ? event.target.valueAsNumber
                : event.target.value,
            );
          }}
        />
        {rightSide && <InputGroupAddon align="inline-end">{rightSide}</InputGroupAddon>}
        {isPassword && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword
                ? <EyeOff className="size-4" />
                : (
                  <Eye className="size-4" />
                )}
            </InputGroupButton>
          </InputGroupAddon>
        )}
        {bottomSide && <InputGroupAddon align="block-end">{bottomSide}</InputGroupAddon>}
      </InputGroup>
    </FormField>
  );
}
