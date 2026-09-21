---
name: layout-feedback
description: >-
  Use when changing React page layouts, dialogs, modals, scrolling containers,
  confirmations, or toast feedback with this repository's shared components.
  Do not apply to isolated CSS changes unrelated to shared layout behavior.
---

# Layout and feedback

- Use `PageSection` slots `Actions`, `Content`, and `Loading` for admin/work screens.
- Use `ScreenLayout` `Content` and `Addon` for standalone screens; do not introduce `ScreenSection`.
- Use `confirm` for destructive confirmations and `openModal` for component dialogs.
- Check global `MutationCache`/`QueryCache` toast behavior before adding mutation toasts; only add manual toasts for client-only actions.
- Use `flex` for horizontal layout and `grid` for vertical regions (`auto 1fr`).
- Do not add `min-h-*` or `min-w-*` utilities. Use explicit sizing and `scroll-y`, `scroll-x`, or `scroll` for overflow.
- `html`, `body`, and `#root` are fixed and overflow-hidden; put scrolling on the actual app-content container.
- Verify the nearest scroll container when using `sticky` or `absolute` positioning.
