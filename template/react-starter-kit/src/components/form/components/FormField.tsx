import { valueIf } from '@pkg/shared/common';

import { Field, FieldContent, FieldDescription, FieldLabel } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useFieldContext } from '#/components/form/core/context';

type FormFieldProps = React.ComponentProps<typeof Field> & {
  label?: React.ReactNode
  description?: React.ReactNode
  showError?: boolean
  labelWidth?: React.CSSProperties['width']
  required?: boolean
  layout?: 'default' | 'choice'
};

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return String(error);
}

export function FormField({
  label,
  description,
  showError = true,
  labelWidth,
  required = false,
  orientation = 'vertical',
  layout = 'default',
  children,
  className,
  ...props
}: Readonly<FormFieldProps>) {
  const field = useFieldContext<unknown>();
  const errors = field.state.meta.errors;
  const isHorizontal = orientation === 'horizontal';
  const hasDescription = Boolean(description);

  // 1. Choice layout (Checkbox, Switch: [Control] + [Label / Description column])
  if (layout === 'choice') {
    return (
      <Field
        orientation={orientation}
        data-invalid={errors.length > 0 || undefined}
        className={cn('flex flex-col items-start justify-start gap-1 w-full', className)}
        {...props}
      >
        <div
          className={cn(
            'flex gap-2.5 items-start justify-start',
            !hasDescription && 'items-center',
          )}
        >
          {children}
          {(label || description) && (
            <div className="grid gap-0.5">
              {label && (
                <FieldLabel
                  className="
                    cursor-pointer flex items-center gap-1 leading-none
                    select-none
                  "
                  htmlFor={field.name}
                  style={valueIf(Boolean(labelWidth), { width: labelWidth })}
                >
                  {label}
                  {required && (
                    <sup
                      className="text-destructive font-bold select-none ml-0.5"
                      aria-hidden="true"
                    >
                      *
                    </sup>
                  )}
                </FieldLabel>
              )}
              {description && <FieldDescription>{description}</FieldDescription>}
            </div>
          )}
        </div>

        {showError && (
          <div className="
            min-h-[calc(var(--text-sm)*var(--text-sm--line-height))]
          "
          >
            {errors.length > 0 && (
              <p className="text-sm font-normal text-destructive" role="alert">
                {getErrorMessage(errors.at(0))}
              </p>
            )}
          </div>
        )}
      </Field>
    );
  }

  // 2. Default layout (Input, Select, Textarea: [Label] -> [Control] -> [Description / Error])
  return (
    <Field
      orientation={orientation}
      data-invalid={errors.length > 0 || undefined}
      className={cn(
        isHorizontal && 'grid grid-cols-subgrid items-start gap-x-4 gap-y-0.5',
        orientation === 'responsive' && `
          flex flex-col
          md:grid md:grid-cols-subgrid md:items-start md:gap-x-4 md:gap-y-0.5
        `,
        orientation === 'vertical' && 'flex flex-col gap-2',
        className,
      )}
      {...props}
    >
      {label && (
        <FieldLabel
          className={cn(
            'flex-none whitespace-nowrap select-none justify-self-start',
            isHorizontal && 'flex h-8 items-center',
            orientation === 'responsive' && 'md:flex md:h-8 md:items-center',
          )}
          htmlFor={field.name}
          style={valueIf(Boolean(labelWidth), { width: labelWidth })}
        >
          {label}
          {required && (
            <sup
              className="text-destructive font-bold select-none ml-0.5"
              aria-hidden="true"
            >
              *
            </sup>
          )}
        </FieldLabel>
      )}

      <FieldContent className="w-full">
        {children}
        {description && <FieldDescription>{description}</FieldDescription>}
        {showError && (
          <div className="
            min-h-[calc(var(--text-sm)*var(--text-sm--line-height))]
          "
          >
            {errors.length > 0 && (
              <p className="text-sm font-normal text-destructive" role="alert">
                {getErrorMessage(errors.at(0))}
              </p>
            )}
          </div>
        )}
      </FieldContent>
    </Field>
  );
}
