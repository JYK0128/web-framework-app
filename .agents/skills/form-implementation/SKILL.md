---
name: form-implementation
description: >-
  Use when adding or changing React forms that create, update, delete, or submit
  data. Require this repository's useAppForm, AppField, registered form fields,
  and FormSubmit patterns. Do not apply to DataGrid filters or immediate UI toggles.
---

# Form implementation

Use the repository form system for every user-submitted form.

## Required rules

- Use `useAppForm`, `form.AppForm`, and `form.AppField`.
- Use registered form fields instead of local input state and ad-hoc submit controls.
- Use `FormLayout` and the existing `FormSubmit`/`FormReset` patterns.
- Preserve form value inference and inspect field source before inventing props.
- For multi-step forms use `StepForm`, `StepFormHeader`, `StepFormContent`, `StepFormFooter`, and `StepFormStep`.
- New fields must follow the existing `FormProps`, error display, and label handling patterns.

## Before handoff

- Confirm every submitted value is owned by the form state.
- Confirm validation and mutation are connected to the form submit handler.
- Confirm submit disabled/loading behavior uses the shared submit component.
- Run the relevant typecheck and lint.
