import { createFormHook } from '@tanstack/react-form';
import { createElement, type PropsWithChildren, useMemo } from 'react';

import { FormFieldDescription, FormFieldGroup, FormFieldLegend, FormFieldSet, FormLayout, FormReset, FormSubmit } from '#/components/form/components';
import { fieldContext, formContext } from '#/components/form/core/context';
import { FormCheckbox, FormCheckGroup, FormCombobox, FormDatePicker, FormDateRangePicker, FormDateTimePicker, FormFileInput, FormInput, FormMarkdownEditor, FormOtpInput, FormRadioGroup, FormSelect, FormSignature, FormSwitch, FormTextarea, FormTimePicker } from '#/components/form/fields';

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

  form.AppForm = useMemo(() => {
    function AppFormWithContext({ children }: PropsWithChildren) {
      return createElement(
        formContext.Provider,
        { value: form },
        children,
      );
    }

    AppFormWithContext.displayName = 'AppFormWithContext';
    return AppFormWithContext;
  }, [form]);

  return form;
};
