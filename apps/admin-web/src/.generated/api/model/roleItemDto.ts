export interface RoleItemDto { id: string; code: string; label: string | null; description: string | null; isSystem: boolean; permissions: string[]; userCount: number }
