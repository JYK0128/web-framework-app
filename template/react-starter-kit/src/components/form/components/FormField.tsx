import { Field, FieldContent, FieldDescription, FieldLabel } from '#.generated/shadcn/components/ui';
import { cn } from '#.generated/shadcn/lib/utils';
import { useFieldContext } from '#components/form/context';

type FormFieldProps = React.ComponentProps<typeof Field> & {
  label?: React.ReactNode
  description?: React.ReactNode
  showError?: boolean
  labelWidth?: React.CSSProperties['width']
  required?: boolean
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
  labelWidth = 'auto',
  required = false,
  orientation,
  children,
  className,
  ...props
}: Readonly<FormFieldProps>) {
  const field = useFieldContext<unknown>();
  const errors = field.state.meta.errors;

  return (
    <Field
      orientation={orientation}
      data-invalid={errors.length > 0 || undefined}
      className={cn(
        orientation === 'responsive' && `
          flex-col
          md:flex-row md:items-center
        `,
        className,
      )}
      {...props}
    >
      {label && (
        <FieldLabel
          className="flex-none! whitespace-normal wrap-break-word"
          htmlFor={field.name}
          style={{ width: labelWidth }}
        >
          {label}
          {required && <sup className="text-red-600"> *</sup>}
        </FieldLabel>
      )}
      <FieldContent>
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
