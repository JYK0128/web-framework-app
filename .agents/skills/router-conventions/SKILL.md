---
name: router-conventions
description: >-
  Use when adding or changing TanStack Router routes, URL-driven dialogs,
  route search parameters, or navigation state in the React application.
---

# Router conventions

- Define search parameters with the route's `validateSearch: z.object({...})`.
- When closing a URL dialog, preserve existing search values and remove only the target key.
- Use `replace: true` when required by the existing route behavior.
- Use same-domain routes in `template/react-starter-kit/src/routes/` as the source for route and search types.
- Keep route state typed and avoid duplicate local representations of URL parameters.
