export interface Permission {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface Role {
  id: string
  name: string
  description: string
  isSystem: boolean
  permissions: Permission[]
  color?: string
  icon?: string
}

export type CustomRole = Role
