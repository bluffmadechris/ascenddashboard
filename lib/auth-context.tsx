"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient, type User as ApiUser, TokenManager } from "./api-client"
import { useRoles } from "./roles-context"
import { loadData, saveData } from "./data-persistence"

// Re-export API User type for compatibility
export type User = ApiUser & {
  // Add any additional frontend-specific fields if needed
  clientAccess?: ClientAccess[]
  socialMedia?: SocialMediaLinks
  password?: string // For backward compatibility with existing code
  bio?: string
}

export type UserRole = string

export type ClientAccess = {
  clientId: string
  canView: boolean
  canEdit: boolean
  canInvoice: boolean
}

export type CustomLink = {
  title: string
  url: string
}

export type SocialMediaLinks = {
  facebook?: string
  twitter?: string
  linkedin?: string
  instagram?: string
  youtube?: string
  customLinks?: CustomLink[]
}

// Define auth context type
type AuthContextType = {
  user: User | null
  users: User[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasClientAccess: (clientId: string, permission: "view" | "edit" | "invoice" | "revenue") => boolean
  hasPermission: (permissionId: string) => boolean
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>
  updateProfile: (userId: string, updates: Partial<User>) => Promise<boolean>
  createUser: (userData: Omit<User, "id"> & { password: string }) => Promise<User>
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  getAvailableClients: () => { id: string; name: string }[]
  refreshUsers: (caller?: string) => void
  isApiConnected: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { roles, getRole } = useRoles()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApiConnected, setIsApiConnected] = useState(false)
  const router = useRouter()

  // Check API connection and load user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Clear any existing default users from localStorage
        const existingUsers = loadData("users", [])
        const hasDefaultUsers = existingUsers.some((user: any) =>
          user.email?.includes("@ascendmedia.com") ||
          user.name === "Admin User" ||
          user.name === "John Smith" ||
          user.name === "Sarah Johnson" ||
          user.name === "Mike Chen" ||
          user.name === "Emily Rodriguez" ||
          user.name === "Alex Thompson"
        )

        if (hasDefaultUsers) {
          console.log("🧹 Clearing default users from localStorage")
          localStorage.removeItem("users")
          localStorage.removeItem("user")
        }

        // Check if API is available
        const healthCheck = await apiClient.healthCheck()
        setIsApiConnected(healthCheck.success)

        // Try to get current user if token exists, regardless of API status
        const token = TokenManager.getToken()
        if (token) {
          try {
            if (healthCheck.success) {
              const userResponse = await apiClient.getCurrentUser()
              if (userResponse.success && userResponse.data?.user) {
                const userData = userResponse.data.user
                const userWithMappedFields = {
                  ...userData,
                  avatar: userData.avatar_url || userData.avatar || "", // Ensure avatar field is properly mapped
                  clientAccess: [] // Default to empty array since API doesn't provide this
                } as unknown as User
                setUser(userWithMappedFields)
                saveData('user', userWithMappedFields)
              } else {
                // Token is invalid or user not found, remove token and fall back to localStorage
                TokenManager.removeToken()
                const storedUser = loadData("user", null)
                if (storedUser) {
                  setUser(storedUser)
                }
              }
            } else {
              // API not available, fall back to localStorage
              const storedUser = loadData("user", null)
              if (storedUser) {
                setUser(storedUser)
              }
            }
          } catch (error) {
            console.error('Failed to get current user:', error)
            // Error getting user, fall back to localStorage
            const storedUser = loadData("user", null)
            if (storedUser) {
              setUser(storedUser)
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        setIsApiConnected(false)
        // Fall back to localStorage
        const storedUser = loadData("user", null)
        if (storedUser) {
          setUser(storedUser)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Load users when API is connected
  useEffect(() => {
    if (isApiConnected && user) {
      console.log('🔄 refreshUsers called from useEffect 1 (isApiConnected && user)')
      refreshUsers('useEffect1')
    }
  }, [isApiConnected, user])

  // Refresh users when window regains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      if (isApiConnected && user) {
        console.log('🔄 refreshUsers called from window focus')
        refreshUsers('windowFocus')
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isApiConnected, user])

  // Refresh users from API or localStorage
  const refreshUsers = async (caller = 'unknown') => {
    console.log(`🔄 refreshUsers called by: ${caller}`)
    if (isApiConnected) {
      try {
        const response = await apiClient.getUsers()
        if (response.success && response.data?.users) {
          // Ensure each user has a clientAccess array (API client already mapped avatar_url, social_links, bio)
          const usersWithClientAccess = response.data.users.map(user => ({
            ...user,
            clientAccess: [] // Default to empty array since API doesn't provide this
          } as unknown as User))

          console.log(`🔄 refreshUsers (${caller}) - API response users:`, usersWithClientAccess.map(u => ({ name: u.name, id: u.id, role: u.role })))
          console.log(`🔄 refreshUsers (${caller}) - Current user:`, { name: user?.name, id: user?.id, role: user?.role })

          // Always include the current user in the users list if they're not already there
          let finalUsers = usersWithClientAccess
          if (user) {
            const currentUserInList = usersWithClientAccess.find(u => u.id === user.id || u.id.toString() === user.id.toString())
            console.log(`🔄 refreshUsers (${caller}) - Current user already in list:`, currentUserInList ? 'YES' : 'NO')

            if (!currentUserInList) {
              console.log(`🔄 refreshUsers (${caller}) - Adding current user to list`)
              finalUsers = [...usersWithClientAccess, user]
            }
          }

          console.log(`🔄 refreshUsers (${caller}) - Final users:`, finalUsers.map(u => ({ name: u.name, id: u.id, role: u.role })))

          setUsers(finalUsers)
          saveData('users', finalUsers)
        }
      } catch (error) {
        console.error('Failed to fetch users from API:', error)
        // If API fails but we have a current user, at least show them
        if (user) {
          setUsers([user])
          saveData('users', [user])
        }
      }
    } else {
      // When API is not connected, include current user if available
      if (user) {
        setUsers([user])
        saveData('users', [user])
      } else {
        setUsers([])
      }
    }
  }

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    if (isApiConnected) {
      try {
        const response = await apiClient.login(email, password)
        console.log("🔄 response", response)
        if (response.success && response.data?.user) {
          // Ensure user has clientAccess property (API client already mapped avatar_url, social_links, bio)
          const userWithClientAccess = {
            ...response.data.user,
            clientAccess: [] // Default to empty array since API doesn't provide this
          } as unknown as User
          setUser(userWithClientAccess)
          saveData('user', userWithClientAccess)

          // Refresh users to include the current user in the team list
          console.log('🔄 Login success - calling refreshUsers in 100ms')
          setTimeout(() => {
            console.log('🔄 Login setTimeout - refreshUsers called')
            refreshUsers('loginTimeout')
          }, 100)

          return true
        }
        return false
      } catch (error) {
        console.error('API login failed:', error)
        return false
      }
    } else {
      // Fall back to localStorage
      console.log("🔄 Fall back to localStorage authentication")
      console.log("🔄 users", users)
      console.log("🔄 email", email)
      console.log("🔄 password", password)
      const matchedUser = users.find((u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )

      if (matchedUser) {
        const { password: _, ...userWithoutPassword } = matchedUser
        setUser(userWithoutPassword)
        saveData("user", userWithoutPassword)

        // Refresh users to ensure current user is included
        setTimeout(() => {
          console.log('🔄 localStorage login setTimeout - refreshUsers called')
          refreshUsers('localStorageLoginTimeout')
        }, 100)

        return true
      }
      return false
    }
  }

  // Logout function
  const logout = async () => {
    if (isApiConnected) {
      try {
        await apiClient.logout()
      } catch (error) {
        console.error('API logout failed:', error)
      }
    }

    setUser(null)
    TokenManager.removeToken()
    localStorage.removeItem("user")
    router.push("/login")
  }

  // Check if user has access to a client
  const hasClientAccess = (clientId: string, permission: "view" | "edit" | "invoice" | "revenue") => {
    if (!user) return false

    // Owner has access to everything
    if (user.role === "owner" || user.role === "admin") return true

    // Check specific client access (for backward compatibility)
    if (user.clientAccess) {
      const clientAccess = user.clientAccess.find((access) => access.clientId === clientId)
      if (!clientAccess) return false

      // Special case for revenue - only owners and specific roles can see it
      if (permission === "revenue") {
        return user.role === "owner" || user.role === "admin" || user.role === "manager"
      }

      switch (permission) {
        case "view":
          return clientAccess.canView
        case "edit":
          return clientAccess.canEdit
        case "invoice":
          return clientAccess.canInvoice
        default:
          return false
      }
    }

    // Default permissions based on role
    switch (user.role) {
      case "admin":
      case "manager":
        return true
      case "user":
        return permission === "view"
      default:
        return false
    }
  }

  // Check if user has a specific permission
  const hasPermission = (permissionId: string) => {
    if (!user) return false

    // Admin and owner have all permissions
    if (user.role === "admin" || user.role === "owner") return true

    // Get the user's role
    const userRole = getRole(user.role)

    // If role not found, deny access
    if (!userRole) return false

    // Find the permission in the role
    const permission = userRole.permissions.find((p) => p.id === permissionId)

    // If permission not found or not enabled, deny access
    if (!permission || !permission.enabled) return false

    return true
  }

  // Password change function
  const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    if (isApiConnected) {
      try {
        const response = await apiClient.changePassword(currentPassword, newPassword)
        if (response.success) {
          // Password changed successfully, user needs to log in again
          await logout()
          return true
        }
        return false
      } catch (error) {
        console.error('API password change failed:', error)
        return false
      }
    } else {
      // Fall back to localStorage
      const userIndex = users.findIndex((u) => u.id.toString() === userId && u.password === currentPassword)

      if (userIndex !== -1) {
        const updatedUsers = [...users]
        updatedUsers[userIndex].password = newPassword
        setUsers(updatedUsers)
        saveData("users", updatedUsers)

        if (user && user.id.toString() === userId) {
          const { password: _, ...userWithoutPassword } = updatedUsers[userIndex]
          setUser(userWithoutPassword)
          saveData("user", userWithoutPassword)
        }

        return true
      }
      return false
    }
  }

  // Update profile function
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      if (!userId) {
        console.error('No user ID provided for profile update')
        return false
      }

      // Convert userId to number for API
      const numericUserId = Number(userId)
      if (isNaN(numericUserId)) {
        console.error('Invalid user ID format')
        return false
      }

      if (isApiConnected) {
        const response = await apiClient.updateUser(numericUserId, updates)
        if (response.success && response.data?.user) {
          const updatedUserData = response.data.user

          // Ensure avatar field is properly mapped from avatar_url
          if (updatedUserData.avatar_url !== undefined) {
            updatedUserData.avatar = updatedUserData.avatar_url
          }

          // Update local user state if the current user is being updated
          if (user && user.id === numericUserId) {
            const updatedUser = { ...user, ...updatedUserData }
            setUser(updatedUser)
            saveData('user', updatedUser)
          }

          // Update users list
          setUsers(prevUsers =>
            prevUsers.map(u => {
              if (u.id === numericUserId) {
                const updatedUser = { ...u, ...updatedUserData }
                // Ensure avatar field is properly mapped
                if (updatedUser.avatar_url !== undefined) {
                  updatedUser.avatar = updatedUser.avatar_url
                }
                return updatedUser
              }
              return u
            })
          )

          // Update users in localStorage
          const updatedUsers = users.map(u => {
            if (u.id === numericUserId) {
              const updatedUser = { ...u, ...updatedUserData }
              if (updatedUser.avatar_url !== undefined) {
                updatedUser.avatar = updatedUser.avatar_url
              }
              return updatedUser
            }
            return u
          })
          saveData('users', updatedUsers)

          return true
        }
        return false
      } else {
        // Offline mode: Update local storage
        const updatedUser = { ...user, ...updates }
        setUser(updatedUser as unknown as User)
        saveData('user', updatedUser)

        // Update in users array
        const updatedUsers = users.map(u =>
          u.id === numericUserId ? { ...u, ...updates } : u
        )
        setUsers(updatedUsers)
        saveData('users', updatedUsers)
        return true
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return false
    }
  }

  // Create user function
  const createUser = async (userData: Omit<User, "id"> & { password: string }): Promise<User> => {
    if (isApiConnected) {
      try {
        const response = await apiClient.createUser({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          title: userData.title,
          department: userData.department,
        })

        if (response.success && response.data?.user) {
          await refreshUsers('createUser')
          return response.data.user
        }
        throw new Error(response.message || 'Failed to create user')
      } catch (error) {
        console.error('API user creation failed:', error)
        throw error
      }
    } else {
      // Fall back to localStorage
      const newUser = {
        id: Date.now(), // Simple ID generation for localStorage
        ...userData,
        clientAccess: userData.clientAccess || [], // Ensure clientAccess is always an array
      }

      const updatedUsers = [...users, newUser]
      setUsers(updatedUsers)
      saveData("users", updatedUsers)

      const { password: _, ...userWithoutPassword } = newUser
      return userWithoutPassword
    }
  }

  // Update user function
  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    if (isApiConnected) {
      try {
        const response = await apiClient.updateUser(parseInt(userId), updates)
        if (response.success && response.data?.user) {
          const updatedUserData = response.data.user

          // Ensure avatar field is properly mapped from avatar_url
          if (updatedUserData.avatar_url !== undefined) {
            updatedUserData.avatar = updatedUserData.avatar_url
          }

          // Update local user state if the current user is being updated
          if (user && user.id.toString() === userId) {
            const updatedUser = { ...user, ...updatedUserData }
            setUser(updatedUser)
            saveData('user', updatedUser)
          }

          // Refresh users to ensure consistency
          await refreshUsers('updateUser')
          return true
        }
        return false
      } catch (error) {
        console.error('API user update failed:', error)
        return false
      }
    } else {
      // Fall back to localStorage
      const userIndex = users.findIndex((u) => u.id.toString() === userId)

      if (userIndex !== -1) {
        const updatedUsers = JSON.parse(JSON.stringify(users))
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          ...updates,
        }

        if (updates.socialMedia) {
          updatedUsers[userIndex].socialMedia = {
            ...(updatedUsers[userIndex].socialMedia || {}),
            ...updates.socialMedia,
          }
        }

        setUsers(updatedUsers)
        saveData("users", updatedUsers)

        if (user && user.id.toString() === userId) {
          const updatedUser = {
            ...user,
            ...updates,
          }

          if (updates.socialMedia) {
            updatedUser.socialMedia = {
              ...(user.socialMedia || {}),
              ...updates.socialMedia,
            }
          }

          setUser(updatedUser)
          saveData("user", updatedUser)
        }

        return true
      }
      return false
    }
  }

  // Delete user function
  const deleteUser = async (userId: string): Promise<boolean> => {
    if (isApiConnected) {
      try {
        const response = await apiClient.deleteUser(parseInt(userId))
        if (response.success) {
          await refreshUsers('deleteUser')
          return true
        }
        return false
      } catch (error) {
        console.error('API user deletion failed:', error)
        return false
      }
    } else {
      // Fall back to localStorage
      const updatedUsers = users.filter((u) => u.id.toString() !== userId)
      setUsers(updatedUsers)
      saveData("users", updatedUsers)
      return true
    }
  }

  // Get available clients (placeholder - would need to be implemented based on your client structure)
  const getAvailableClients = () => {
    // Return the available clients that can be assigned to team members
    return [
      { id: "capri", name: "Capri" },
      { id: "piper-rockelle", name: "Piper Rockelle" },
      { id: "paryeet", name: "Paryeet" },
      { id: "lacy-vods", name: "Lacy VODS" },
    ]
  }

  const value: AuthContextType = {
    user,
    users,
    login,
    logout,
    isLoading,
    hasClientAccess,
    hasPermission,
    changePassword,
    updateProfile,
    createUser,
    updateUser,
    deleteUser,
    getAvailableClients,
    refreshUsers,
    isApiConnected,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
