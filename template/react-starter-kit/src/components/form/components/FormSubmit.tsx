import { Button } from '#/.generated/shadcn/components/ui';
import { useFormContext } from '#/components/form/core/context';

export function FormSubmit(props: Readonly<React.ComponentProps<typeof Button>>) {
  const form = useFormContext();
  const { canSubmit, isSubmitting } = form.state;

  return <Button {...props} type="submit" disabled={!canSubmit || isSubmitting} />;
}
