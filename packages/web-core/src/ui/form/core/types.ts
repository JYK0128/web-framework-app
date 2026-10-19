import type { CSSProperties, ElementType, ReactNode } from 'react';

export type FormFieldOptions = {
  label?: ReactNode
  description?: ReactNode
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  labelWidth?: CSSProperties['width']
  required?: boolean
};

// AppField owns field identity, values and validation. Event callbacks remain
// available as notifications and run after the form state has been updated.
type FormManagedProp
  = | 'id'
    | 'name'
    | 'value'
    | 'defaultValue'
    | 'checked'
    | 'defaultChecked'
    | 'invalid'
    | 'aria-invalid'
    | 'dangerouslySetInnerHTML'
    | 'render';

type FormEventProp = 'onChange' | 'onBlur' | 'onCheckedChange' | 'onValueChange' | 'onComplete';

export type FormProps<TComponent extends ElementType> = Omit<
  Optional<WithoutChildren<TComponent>, Extract<keyof WithoutChildren<TComponent>, FormEventProp>>,
  FormManagedProp | keyof FormFieldOptions
> & FormFieldOptions;

export type FormAdornmentProps = {
  leftSide?: ReactNode
  rightSide?: ReactNode
  topSide?: ReactNode
  bottomSide?: ReactNode
};

export type FormOption = {
  label: ReactNode
  value: string
  disabled?: boolean
};
