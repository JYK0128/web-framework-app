---
name: design-system
description: >-
  Use when adding or changing React UI that uses this repository's shared
  DataGrid, form, dialog/feedback, or layout components. Do not apply to
  generic React, CSS, or generated-code work that does not touch these primitives.
---

# UI design system

Use the independently discoverable `data-grid-implementation`, `form-implementation`,
and `layout-feedback` skills when those workflows apply. This skill covers shared
component discovery and reuse across React UI work.

## Rules

1. Check source exports and prop types before using a component. Update references when behavior changes.
2. Do not create wrappers or ad-hoc UI patterns when a shared component already exists.
3. Follow global success/error toast handling for API queries and mutations; do not duplicate it in components. Manual toasts are allowed for client-only actions.
4. Do not duplicate rules owned by the specialized skills; apply those skills independently when their triggers match.
