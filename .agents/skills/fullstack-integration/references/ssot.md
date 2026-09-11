# SSOT

- Change endpoints in this order: Entity/DTO → Command/Query/Handler → Controller/Swagger → codegen → UI.
- Check `template/react-starter-kit/orval.config.ts` and `package.json` for codegen settings.
- Treat server DTOs and Swagger/OpenAPI as the API source of truth.
- Update the server contract before running codegen.
- Use generated types, hooks, and schemas directly in React.
- Never edit generated files manually.
- Do not add duplicate local models, mapping objects, compatibility wrappers, or behaviorless variables/functions.
- When the contract changes, replace legacy models and references with the new generated contract; do not keep parallel names or compatibility layers.
- Use the generated types consistently, remove unused code, then run server/client typechecks and reference searches.
