import { Button } from '#.generated/shadcn/components/ui';
import { useFormContext } from '#components/form/context';

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
