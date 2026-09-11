# Router

- Define search parameters with the route's `validateSearch: z.object({...})`.
- When closing a URL dialog, preserve existing search values and remove only the target key.
- Use `replace: true` when required by the existing route behavior.
- Use the same-domain routes in `template/react-starter-kit/src/routes/` as the source for route and search types.
