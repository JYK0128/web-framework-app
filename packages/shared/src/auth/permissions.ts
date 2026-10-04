export interface PermissionDefinition {
  readonly code: string
  readonly resource: string
  readonly action: string
  readonly label: string
  readonly description?: string
}
