export interface UserPrincipal {
  type: 'user'
  id: string
  roles: string[]
  permissions: string[]
}

export interface MachinePrincipal {
  type: 'machine'
  id: string
}

export type AuthenticatedPrincipal = UserPrincipal | MachinePrincipal;
