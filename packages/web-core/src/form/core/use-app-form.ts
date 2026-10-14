import { FormFieldDescription, FormFieldGroup, FormFieldLegend, FormFieldSet, FormLayout, FormReset, FormSubmit } from '@pkg/web-core/form/components';
import { FormCheckbox, FormDatetimePicker, FormEditor, FormFileInput, FormInput, FormOtpInput, FormSelect, FormSwitch, FormTextarea, FormTimePicker } from '@pkg/web-core/form/fields';
import { createFormHook } from '@tanstack/react-form';
import { createElement, type PropsWithChildren, useMemo } from 'react';

import { fieldContext, formContext } from './context';

const hook = createFormHook({
  fieldComponents: {
    Input: FormInput,
    OtpInput: FormOtpInput,
    DatetimePicker: FormDatetimePicker,
    Checkbox: FormCheckbox,
    Switch: FormSwitch,
    FileInput: FormFileInput,
    TimePicker: FormTimePicker,
    Select: FormSelect,
    Textarea: FormTextarea,
    Editor: FormEditor,
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
