import { createFormHook } from '@tanstack/react-form';
import { createElement, type PropsWithChildren, useMemo } from 'react';

import { FormFieldDescription, FormFieldGroup, FormFieldLegend, FormFieldSet, FormLayout, FormReset, FormSubmit } from '#/components/form/components';
import { fieldContext, formContext } from '#/components/form/core/context';
import { FormCheckbox, FormDatetimePicker, FormFileInput, FormInput, FormSelect, FormSwitch, FormTextarea, FormTimePicker } from '#/components/form/fields';

const hook = createFormHook({
  fieldComponents: {
    Input: FormInput,
    DatetimePicker: FormDatetimePicker,
    Checkbox: FormCheckbox,
    Switch: FormSwitch,
    FileInput: FormFileInput,
    TimePicker: FormTimePicker,
    Select: FormSelect,
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
