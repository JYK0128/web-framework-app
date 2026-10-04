# Frontend CSS utilities

Admin and Service web apps define project-specific Tailwind utilities in their CSS entry points:

- Admin: `apps/admin-web/src/styles/styles.css`
- Service: `apps/service-web/src/styles/styles.css`

## Scrolling

Apply scrolling to the element that owns the overflow, not to `html`, `body`, or `#root` (the app shell keeps those fixed and overflow-hidden).

- `scroll-y`: vertical scrolling for lists and content panels.
- `scroll-x`: horizontal scrolling for wide rows or tables.
- `scroll`: scrolling in both directions.

These utilities also constrain overscroll and enable touch scrolling. Check the nearest scroll container when combining them with `sticky` or `absolute` positioning.

## CSS anchor positioning

Use the anchor utilities to align a companion control with a form field. Keep the custom-ident token the same on the anchor and its positioned companion.

```tsx
<Input className="anchor-name-[--email-from]" />
<Button className="anchor-position-[--email-from]" />
```

`anchor-name-*` sets `anchor-name`; `anchor-position-*` sets absolute positioning, `position-anchor`, and the default `center right` position area. The companion can add a modifier to choose another position area where needed.

Form fields derive their anchor names from the runtime field path. They use the `anchor-name-field` utility, while `getFieldAnchorStyle` provides the field-specific `--form-field-anchor-name` CSS variable:

```tsx
<Input
  className="anchor-name-field"
  style={getFieldAnchorStyle(field.name)}
/>
```

Use the shared helper for dynamic form field names. For fixed names, use `anchor-name-[--token]` directly. Do not set the `anchorName` property inline or write arbitrary `[anchor-name:...]` classes.
