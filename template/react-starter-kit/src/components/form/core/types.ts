import type { ComponentProps, CSSProperties, ElementType, ReactNode } from 'react';

export type FormProps<TComponent extends ElementType> = ComponentProps<TComponent> & {
  label?: ReactNode
  description?: ReactNode
  orientation?: 'vertical' | 'horizontal' | 'responsive'
  showError?: boolean
  labelWidth?: CSSProperties['width']
  required?: boolean
};

export type FormOption = {
  label: ReactNode
  value: string
  disabled?: boolean
};

