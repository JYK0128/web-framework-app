import { Button } from '#ui';
import { useFormContext } from '#ui/form/core/context';

export function FormReset({ children, ...props }: Readonly<React.ComponentProps<'button'>>) {
  const form = useFormContext();

  return (
    <Button
      {...props}
      type="reset"
      onClick={() => {
        form.reset();
      }}
    >
      {children}
    </Button>
  );
}
