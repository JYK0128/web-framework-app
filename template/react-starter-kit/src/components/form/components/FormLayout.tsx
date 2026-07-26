import { useFormContext } from '#/components/form/context';

export function FormLayout({ children, ...props }: Readonly<React.ComponentProps<'form'>>) {
  const form = useFormContext();

  return (
    <form
      {...props}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!form.state.isSubmitting) {
          props.onSubmit?.(event);
        }
      }}
    >
      {children}
    </form>
  );
}
