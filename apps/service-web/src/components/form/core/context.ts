import { type AnyFieldApi, type AnyFormApi, createFormHookContexts } from '@tanstack/react-form';
import type { Context } from 'react';

const contexts = createFormHookContexts();

export const fieldContext: Context<AnyFieldApi> = contexts.fieldContext;
export const formContext: Context<AnyFormApi> = contexts.formContext;
export const useFieldContext = contexts.useFieldContext;

export function useFormContext<TFormApi = AnyFormApi, TFormData = unknown>() {
  const form = contexts.useFormContext();

  return form as unknown as TFormApi & {
    state: {
      values: TFormData
    }
  };
}
