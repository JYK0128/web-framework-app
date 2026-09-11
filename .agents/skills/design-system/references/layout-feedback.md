# Layout and feedback

## Sources

- Page layout: `template/react-starter-kit/src/components/layout/page-section.tsx`
- Auth and standalone screens: `template/react-starter-kit/src/components/layout/screen-layout.tsx`
- Global layout CSS: `template/react-starter-kit/src/styles.css`
- Composite dialogs: `template/react-starter-kit/src/components/dialog/`
- Confirmation dialog and global mount: `template/react-starter-kit/src/components/app/system-dialog.tsx`, `routes/__root.tsx`
- Global API toasts: `template/react-starter-kit/src/router.tsx`

## Components and layout

- Use `PageSection` `Actions`, `Content`, and `Loading` slots for admin/work screens.
- Use `ScreenLayout` `Content` and `Addon` slots for standalone screens such as login, 2FA, and onboarding. Do not use `ScreenSection`.
- Use `confirm` for destructive confirmations and `openDialog` for component dialogs.
- Check `router.tsx` `MutationCache`/`QueryCache` and silent settings for API toasts. Do not show duplicate messages in API callbacks.
- Manual toasts are allowed for client-only actions such as copy completion or local filter reset.
- Use `flex` for horizontal layout: `flex items-center` and `flex items-center justify-between`.
- Use `grid` for vertical regions; put fixed headers/toolbars in `auto` and flexible content in `1fr`.

## Global scrolling

- Build on the global `* { min-h-0 min-w-0 }` rule in `styles.css`; do not repeat these classes on every child.
- `html`, `body`, and `#root` use `fixed inset-0 overflow-hidden`; put scrolling on the actual app-content container, not `body`.
- Use `scroll-y` for vertical, `scroll-x` for horizontal, and `scroll` for both directions. These utilities also configure positioning, overscroll, touch behavior, and spacing.
- `scroll-y` applies `overflow-y-auto` and `scroll-x` applies `overflow-x-auto`; verify how the nearest scroll container affects `sticky` and `absolute` positioning.

## Positioning

- `relative` plus `absolute` makes the parent the positioning context and removes the child from flow; the child scrolls with the parent content.
- `sticky` remains in flow and attaches to the scroll container; check the nearest container, `top-0`, height, and overflow.
- `fixed` is viewport-relative and removed from flow; specify `inset-*` or directional values with required spacing and `z-index`.

### Selection guide

```text
overlap content               → relative + absolute
stick to a scroll area         → sticky + top-0
fixed to the browser viewport  → fixed
```
