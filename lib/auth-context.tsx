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
  refreshUsers: () => void
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
                setUser(userResponse.data.user)
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

  // Load users when API is connected, or initialize default users
  useEffect(() => {
    if (isApiConnected && user) {
      refreshUsers()
    } else if (!isApiConnected) {
      // Initialize default users for localStorage mode
      initializeDefaultUsers()
    }
  }, [isApiConnected, user])

  // Ensure users are refreshed before rendering meeting forms
  useEffect(() => {
    if (isApiConnected) {
      refreshUsers()
    }
  }, [])

  // Initialize default users if none exist
  const initializeDefaultUsers = () => {
    const existingUsers = loadData("users", [])

    if (existingUsers.length === 0) {
      const defaultUsers = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@ascendmedia.com",
          role: "admin",
          password: "admin123",
          avatar: "",
          bio: "System administrator with full access to all features and settings.",
          socialMedia: {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "",
            youtube: "",
            customLinks: [],
          },
          clientAccess: [],
        },
        {
          id: "2",
          name: "John Smith",
          email: "john@ascendmedia.com",
          role: "owner",
          password: "password123",
          avatar: "",
          bio: "CEO and Founder of Ascend Media. Leading the company vision and strategic direction.",
          socialMedia: {
            facebook: "",
            twitter: "",
            linkedin: "https://linkedin.com/in/johnsmith",
            instagram: "",
            youtube: "",
            customLinks: [],
          },
          clientAccess: [],
        },
        {
          id: "3",
          name: "Sarah Johnson",
          email: "sarah@ascendmedia.com",
          role: "manager",
          password: "password123",
          avatar: "",
          bio: "Creative Director overseeing all design and content strategy initiatives.",
          socialMedia: {
            facebook: "",
            twitter: "https://twitter.com/sarahj_creative",
            linkedin: "",
            instagram: "https://instagram.com/sarahj_creative",
            youtube: "",
            customLinks: [],
          },
          clientAccess: [],
        },
        {
          id: "4",
          name: "Mike Chen",
          email: "mike@ascendmedia.com",
          role: "designer",
          password: "password123",
          avatar: "",
          bio: "Senior graphic designer specializing in brand identity and digital marketing materials.",
          socialMedia: {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "https://instagram.com/mikechen_design",
            youtube: "",
            customLinks: [
              { title: "Portfolio", url: "https://mikechen.design" }
            ],
          },
          clientAccess: [],
        },
        {
          id: "5",
          name: "Emily Rodriguez",
          email: "emily@ascendmedia.com",
          role: "editor",
          password: "password123",
          avatar: "",
          bio: "Video editor and content creator with expertise in YouTube and social media content.",
          socialMedia: {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "",
            youtube: "https://youtube.com/c/emilyedits",
            customLinks: [],
          },
          clientAccess: [],
        },
        {
          id: "6",
          name: "Alex Thompson",
          email: "alex@ascendmedia.com",
          role: "youtube_manager",
          password: "password123",
          avatar: "",
          bio: "YouTube channel manager focusing on growth strategies and audience engagement.",
          socialMedia: {
            facebook: "",
            twitter: "https://twitter.com/alexyt_manager",
            linkedin: "https://linkedin.com/in/alexthompson-yt",
            instagram: "",
            youtube: "",
            customLinks: [],
          },
          clientAccess: [],
        }
      ]

      setUsers(defaultUsers as unknown as User[])
      saveData("users", defaultUsers)
      console.log("✅ Default users initialized")
    } else {
      setUsers(existingUsers)
    }
  }

  // Refresh users from API or localStorage
  const refreshUsers = async () => {
    if (isApiConnected) {
      try {
        const response = await apiClient.getUsers()
        if (response.success && response.data?.users) {
          // Ensure each user has a clientAccess array for frontend compatibility
          const usersWithClientAccess = response.data.users.map(user => ({
            ...user,
            clientAccess: [] // Default to empty array since API doesn't provide this
          } as unknown as User))
          setUsers(usersWithClientAccess)
        }
      } catch (error) {
        console.error('Failed to fetch users from API:', error)
      }
    } else {
      // Fall back to localStorage
      const refreshedUsers = loadData("users", [])
      if (refreshedUsers && Array.isArray(refreshedUsers)) {
        setUsers(refreshedUsers)
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
          // Ensure user has clientAccess property for frontend compatibility
          const userWithClientAccess = {
            ...response.data.user,
            clientAccess: [] // Default to empty array since API doesn't provide this
          } as unknown as User
          setUser(userWithClientAccess)
          return true
        }
        return false
      } catch (error) {
        console.error('API login failed:', error)
        return false
      }
    } else {
      // Fall back to localStorage authentication
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
          // Update local user state if the current user is being updated
          if (user && user.id === numericUserId) {
            setUser({ ...user, ...response.data.user })
          }
          // Update users list
          setUsers(prevUsers =>
            prevUsers.map(u => (u.id === numericUserId ? { ...u, ...response.data?.user } : u))
          )
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
          await refreshUsers()
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
        if (response.success) {
          await refreshUsers()
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
          await refreshUsers()
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
