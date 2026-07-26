import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { createElement, type PropsWithChildren } from 'react';

import { FormFieldDescription, FormFieldGroup, FormFieldLegend, FormFieldSet, FormLayout, FormReset, FormSubmit } from '#components/form/components';
import { FormCheckbox, FormCheckGroup, FormCombobox, FormDatePicker, FormDateRangePicker, FormDateTimePicker, FormFileInput, FormInput, FormMarkdownEditor, FormOtpInput, FormRadioGroup, FormSelect, FormSignature, FormSwitch, FormTextarea, FormTimePicker } from '#components/form/field';

const contexts = createFormHookContexts();

export const fieldContext = contexts.fieldContext;
export const formContext = contexts.formContext;
export const useFieldContext = contexts.useFieldContext;

export function useFormContext<TFormData = unknown>() {
  const form = contexts.useFormContext();

  return form as unknown as AppForm & {
    state: {
      values: TFormData
    }
  };
}

const hook = createFormHook({
  fieldComponents: {
    Input: FormInput,
    Switch: FormSwitch,
    Select: FormSelect,
    Signature: FormSignature,
    Checkbox: FormCheckbox,
    CheckGroup: FormCheckGroup,
    Combobox: FormCombobox,
    DatePicker: FormDatePicker,
    DateRangePicker: FormDateRangePicker,
    DateTimePicker: FormDateTimePicker,
    TimePicker: FormTimePicker,
    FileInput: FormFileInput,
    MarkdownEditor: FormMarkdownEditor,
    OtpInput: FormOtpInput,
    RadioGroup: FormRadioGroup,
    Textarea: FormTextarea,
  },
  formComponents: {
    Layout: FormLayout,
    Submit: FormSubmit,
    Reset: FormReset,
    FieldSet: FormFieldSet,
    FieldLegend: FormFieldLegend,
    FieldDescription: FormFieldDescription,
    FieldGroup: FormFieldGroup,
  },
  fieldContext,
  formContext,
});

type AppForm = ReturnType<typeof hook.useAppForm>;

export const useAppForm: typeof hook.useAppForm = (props) => {
  const form = hook.useAppForm(props);

  function AppFormWithContext({ children }: PropsWithChildren) {
    return createElement(
      contexts.formContext.Provider,
      { value: form },
      children,
    );
  }

  AppFormWithContext.displayName = 'AppFormWithContext';
  form.AppForm = AppFormWithContext;

  return form;
};
