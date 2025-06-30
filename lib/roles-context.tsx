"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { loadData, saveData } from "@/lib/data-persistence"
import type { Role, Permission } from "./role-types"
import { generateId } from "./uuid"

// Define default permissions
const DEFAULT_PERMISSIONS: Permission[] = [
  { id: "view_dashboard", name: "View Dashboard", description: "Can view the main dashboard", enabled: true },
  { id: "manage_tasks", name: "Manage Tasks", description: "Can create and edit tasks", enabled: false },
  { id: "manage_projects", name: "Manage Projects", description: "Can create and edit projects", enabled: false },
  { id: "view_contracts", name: "View Contracts", description: "Can view contracts", enabled: false },
  { id: "manage_contracts", name: "Manage Contracts", description: "Can create and edit contracts", enabled: false },
  { id: "view_invoices", name: "View Invoices", description: "Can view invoices", enabled: false },
  { id: "manage_invoices", name: "Manage Invoices", description: "Can create and edit invoices", enabled: false },
  { id: "view_clients", name: "View Clients", description: "Can view clients", enabled: false },
  { id: "manage_clients", name: "Manage Clients", description: "Can create and edit clients", enabled: false },
  { id: "view_calendar", name: "View Calendar", description: "Can view the calendar", enabled: true },
  {
    id: "manage_calendar",
    name: "Manage Calendar",
    description: "Can create and edit calendar events",
    enabled: false,
  },
  { id: "view_team", name: "View Team", description: "Can view team members", enabled: true },
  { id: "manage_team", name: "Manage Team", description: "Can create and edit team members", enabled: false },
  { id: "view_availability", name: "View Availability", description: "Can view availability", enabled: true },
  {
    id: "manage_availability",
    name: "Manage Availability",
    description: "Can create and edit availability",
    enabled: false,
  },
  { id: "manage_roles", name: "Manage Roles", description: "Can create and edit roles", enabled: false },
  { id: "view_reports", name: "View Reports", description: "Can view reports", enabled: false },
  { id: "manage_reports", name: "Manage Reports", description: "Can create and edit reports", enabled: false },
]

// Define default roles
const DEFAULT_ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    description: "Full access to all features",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map((p) => ({ ...p, enabled: true })),
    color: "purple",
    icon: "👑",
  },
  {
    id: "admin",
    name: "Manager",
    description: "Administrative access to the system",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map((p) => ({
      ...p,
      enabled: ["manage_users", "manage_content", "view_reports"].includes(p.id),
    })),
    color: "blue",
    icon: "🔹",
  },
  {
    id: "employee",
    name: "Creative",
    description: "Basic access to the platform",
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map((p) => ({
      ...p,
      enabled: ["view_dashboard", "view_calendar", "view_team", "view_availability", "manage_availability"].includes(
        p.id,
      ),
    })),
    color: "amber",
    icon: "🌟",
  },
]

interface RolesContextType {
  roles: Role[]
  isLoading: boolean
  createRole: (role: Omit<Role, "id">) => Role
  updateRole: (id: string, updates: Partial<Role>) => boolean
  deleteRole: (id: string) => boolean
  getRole: (id: string) => Role | undefined
  getRoleByName: (name: string) => Role | undefined
  getDefaultPermissions: () => Permission[]
}

const RolesContext = createContext<RolesContextType | undefined>(undefined)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize or load saved roles
  useEffect(() => {
    const savedRoles = loadData("roles", null)

    if (savedRoles && Array.isArray(savedRoles) && savedRoles.length > 0) {
      setRoles(savedRoles)
    } else {
      // If no saved roles, use defaults
      setRoles(DEFAULT_ROLES)
      saveData("roles", DEFAULT_ROLES)
    }

    setIsLoading(false)
  }, [])

  // Save roles when they change
  useEffect(() => {
    if (!isLoading) {
      saveData("roles", roles)
    }
  }, [roles, isLoading])

  // Create a new role
  const createRole = (role: Omit<Role, "id">): Role => {
    const newRole: Role = {
      id: generateId(),
      ...role,
    }

    setRoles((prevRoles) => [...prevRoles, newRole])
    return newRole
  }

  // Update an existing role
  const updateRole = (id: string, updates: Partial<Role>): boolean => {
    const roleIndex = roles.findIndex((role) => role.id === id)

    if (roleIndex === -1) return false

    // Don't allow updating system roles (except for permissions)
    if (roles[roleIndex].isSystem && (updates.name || updates.description || updates.isSystem)) {
      return false
    }

    const updatedRoles = [...roles]
    updatedRoles[roleIndex] = {
      ...updatedRoles[roleIndex],
      ...updates,
    }

    setRoles(updatedRoles)
    return true
  }

  // Delete a role
  const deleteRole = (id: string): boolean => {
    const role = roles.find((role) => role.id === id)

    if (!role) return false

    // Don't allow deleting system roles
    if (role.isSystem) return false

    setRoles((prevRoles) => prevRoles.filter((role) => role.id !== id))
    return true
  }

  // Get a role by ID
  const getRole = (id: string): Role | undefined => {
    return roles.find((role) => role.id === id)
  }

  // Get a role by name
  const getRoleByName = (name: string): Role | undefined => {
    return roles.find((role) => role.name.toLowerCase() === name.toLowerCase())
  }

  // Get default permissions
  const getDefaultPermissions = (): Permission[] => {
    return DEFAULT_PERMISSIONS.map((p) => ({ ...p }))
  }

  const contextValue = React.useMemo(
    () => ({
      roles,
      isLoading,
      createRole,
      updateRole,
      deleteRole,
      getRole,
      getRoleByName,
      getDefaultPermissions,
    }),
    [roles, isLoading],
  )

  return <RolesContext.Provider value={contextValue}>{children}</RolesContext.Provider>
}

export function useRoles() {
  const context = useContext(RolesContext)
  if (context === undefined) {
    throw new Error("useRoles must be used within a RolesProvider")
  }
  return context
}
