import { useFormContext } from '@pkg/web-core/form/core/context';
import { Button } from '@pkg/web-core/ui';

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
