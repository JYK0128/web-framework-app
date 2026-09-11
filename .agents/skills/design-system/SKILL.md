---
name: design-system
description: >-
  Use when adding or changing React UI that uses this repository's shared
  DataGrid, form, dialog/feedback, or layout components. Do not apply to
  generic React, CSS, or generated-code work that does not touch these primitives.
---

# UI design system

Reuse shared UI components and follow their actual exports and prop types.

## Scope

Read only the reference relevant to the current task.

- DataGrid, columns, search, sorting, pagination → [DataGrid](references/data-grid.md)
- `useAppForm`, `AppField`, `StepForm`, fields → [Forms](references/forms.md)
- `PageSection`, `ScreenLayout`, dialogs, toasts, scrolling layouts → [Layout and feedback](references/layout-feedback.md)

## Rules

1. Check source exports and prop types before using a component. Update references when behavior changes.
2. Do not create wrappers or ad-hoc UI patterns when a shared component already exists.
3. Follow global success/error toast handling for API queries and mutations; do not duplicate it in components. Manual toasts are allowed for client-only actions.
4. Use `flex` for horizontal layout and `grid` for vertical regions (`auto 1fr`). Prefer the global `* { min-h-0 min-w-0 }` rule and `scroll-y`/`scroll-x`/`scroll` utilities.
