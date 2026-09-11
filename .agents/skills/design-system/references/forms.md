# Form system

## Sources

- Entry point: `template/react-starter-kit/src/components/form/`
- Form hook registration: `core/use-app-form.ts`
- Multi-step forms: `step-form/`

## Usage

- Use `useAppForm`, `form.AppForm`, and `form.AppField`.
- Use `FormLayout` for standard forms and follow existing `FormSubmit`/`FormReset` patterns.
- Registered fields include `Input`, `Switch`, `Select`, `Signature`, `Checkbox`, `CheckGroup`, `Combobox`, `DatePicker`, `DateRangePicker`, `DatetimePicker`, `TimePicker`, `FileInput`, `MarkdownEditor`, `OtpInput`, `RadioGroup`, and `Textarea`.
- Preserve inference from the `AppField` form value type. Check the component source instead of inventing props for unsupported behavior.
- Use `StepForm`, `StepFormHeader`, `StepFormContent`, `StepFormFooter`, and `StepFormStep` for multi-step forms.
- New fields must follow `fields/` `FormProps`, error display, and label handling patterns.
