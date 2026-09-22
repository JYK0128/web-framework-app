import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormSwitchProps = FormProps<typeof SwitchPrimitive.Root> & {
  label?: React.ReactNode
  description?: React.ReactNode
};

export function FormSwitch({ label, description, className, ...props }: FormSwitchProps) {
  const field = useFieldContext<boolean | null | undefined>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField label={label} description={description} layout="choice" showError>
      <SwitchPrimitive.Root
        {...props}
        checked={Boolean(field.state.value)}
        aria-invalid={hasError || undefined}
        className={cn(
          `
            group relative inline-flex h-[18.4px] w-8 shrink-0 items-center
            rounded-full border border-transparent transition-all outline-none
          `,
          `
            focus-visible:ring-3 focus-visible:ring-ring/50
            data-checked:bg-primary
            data-unchecked:bg-input
          `,
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onCheckedChange={(checked, eventDetails) => {
          props.onCheckedChange?.(checked, eventDetails);
          field.handleChange(checked);
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
      >
        <SwitchPrimitive.Thumb className="
          pointer-events-none block size-4 rounded-full bg-background
          transition-transform
          group-data-checked:translate-x-[calc(100%-2px)]
        "
        />
      </SwitchPrimitive.Root>
    </FormField>
  );
}
