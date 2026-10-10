import { Editor } from '#/components/editor';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormEditorProps = FormProps<typeof Editor>;

export function FormEditor({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  onChange,
  onBlur,
  ...props
}: FormEditorProps) {
  const field = useFieldContext<string>();

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Editor
        {...props}
        name={field.name}
        label={typeof label === 'string' ? label : undefined}
        required={required}
        invalid={field.state.meta.errors.length > 0}
        value={field.state.value ?? ''}
        onChange={(html) => {
          field.handleChange(html === '<p><br></p>' ? '' : html);
          onChange?.(html);
        }}
        onBlur={() => {
          field.handleBlur();
          onBlur?.();
        }}
      />
    </FormField>
  );
}
