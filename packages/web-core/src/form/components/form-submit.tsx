import { useFormContext } from '@pkg/web-core/form/core/context';
import { Button } from '@pkg/web-core/ui';

export function FormSubmit(props: Readonly<React.ComponentProps<typeof Button>>) {
  const form = useFormContext();
  const { canSubmit, isSubmitting } = form.state;

  return <Button {...props} variant={props.variant ?? 'outline'} type="submit" disabled={props.disabled || !canSubmit || isSubmitting} />;
}
