export function FormFieldLegend({ children, ...props }: Readonly<React.ComponentProps<'legend'>>) {
  return (
    <legend {...props}>
      {children}
    </legend>
  );
}
