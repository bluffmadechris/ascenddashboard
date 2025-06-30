"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { Notification } from "@/lib/notification-types"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => Promise<void>
  clearRead: () => Promise<void>
  isClearing: boolean
  debugNotifications: () => void // Add this line
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isClearing, setIsClearing] = useState(false)
  const isMounted = useRef(true)

  // Track if we're in the middle of a clearing operation to prevent race conditions
  const clearingInProgress = useRef(false)

  // Track if we've initialized from localStorage to prevent double-loading
  const hasInitialized = useRef(false)

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  // Load notifications from localStorage on mount - ONCE only
  useEffect(() => {
    // Set up the mounted ref
    isMounted.current = true

    // Only load from localStorage if we haven't initialized yet
    if (!hasInitialized.current) {
      try {
        const savedNotifications = localStorage.getItem("notifications")
        if (savedNotifications) {
          // Parse the saved notifications and convert timestamp strings back to Date objects
          const parsed = JSON.parse(savedNotifications)
          const withDates = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))

          if (isMounted.current) {
            setNotifications(withDates)
            hasInitialized.current = true
          }
        } else {
          // Even if there are no notifications, mark as initialized
          hasInitialized.current = true
        }
      } catch (e) {
        console.error("Failed to parse saved notifications:", e)
        if (isMounted.current) {
          setNotifications([])
          hasInitialized.current = true
        }
      }
    }

    // Clean up function
    return () => {
      isMounted.current = false
    }
  }, [])

  // Save notifications to localStorage when they change
  useEffect(() => {
    // Skip initial render or when clearing is in progress
    if (!hasInitialized.current || clearingInProgress.current) {
      return
    }

    try {
      if (notifications.length > 0) {
        localStorage.setItem("notifications", JSON.stringify(notifications))
      } else {
        // If there are no notifications, remove the item from localStorage
        localStorage.removeItem("notifications")
      }
    } catch (e) {
      console.error("Failed to save notifications to localStorage:", e)
    }
  }, [notifications])

  // Add a new notification
  const addNotification = useCallback(
    (notification: Notification) => {
      // Don't add notifications if we're clearing
      if (isClearing || clearingInProgress.current) {
        return notification
      }

      // Ensure timestamp is a Date object
      const newNotification = {
        ...notification,
        timestamp:
          notification.timestamp instanceof Date
            ? notification.timestamp
            : new Date(notification.timestamp || Date.now()),
        id: notification.id || Math.random().toString(36).substring(2, 9),
        read: notification.read || false,
      }

      setNotifications((prev) => [newNotification, ...prev])
      return newNotification
    },
    [isClearing],
  )

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  // Clear all notifications - Fixed implementation
  const clearAll = useCallback(async () => {
    // If already clearing, don't start another clear operation
    if (clearingInProgress.current) {
      return
    }

    try {
      // Set clearing state
      setIsClearing(true)
      clearingInProgress.current = true

      // First, clear from localStorage to prevent race conditions
      localStorage.removeItem("notifications")

      // Force a small delay to ensure localStorage is cleared
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Then clear from state
      setNotifications([])

      // Dispatch a custom event that other components can listen for
      const event = new CustomEvent("notificationsCleared", {
        detail: { timestamp: new Date().toISOString() },
      })
      window.dispatchEvent(event)

      // Log the action for analytics or debugging
      console.log("All notifications cleared at", new Date().toISOString())

      // Add a small delay to ensure the UI has time to update
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (error) {
      console.error("Error clearing notifications:", error)

      // If there was an error, make sure we still clear the state
      setNotifications([])
      localStorage.removeItem("notifications")
    } finally {
      // Reset clearing state
      clearingInProgress.current = false
      if (isMounted.current) {
        setIsClearing(false)
      }
    }
  }, [])

  // Clear read notifications
  const clearRead = useCallback(async () => {
    // If already clearing, don't start another clear operation
    if (clearingInProgress.current) {
      return
    }

    try {
      setIsClearing(true)
      clearingInProgress.current = true

      // Get only unread notifications
      const unreadNotifications = notifications.filter((n) => !n.read)

      // First update localStorage to prevent race conditions
      if (unreadNotifications.length > 0) {
        localStorage.setItem("notifications", JSON.stringify(unreadNotifications))
      } else {
        localStorage.removeItem("notifications")
      }

      // Then update state
      setNotifications(unreadNotifications)

      // Log the action
      const clearedCount = notifications.length - unreadNotifications.length
      console.log(`${clearedCount} read notifications cleared at`, new Date().toISOString())

      // Add a small delay to ensure the UI has time to update
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (error) {
      console.error("Error clearing read notifications:", error)
    } finally {
      clearingInProgress.current = false
      if (isMounted.current) {
        setIsClearing(false)
      }
    }
  }, [notifications])

  // Listen for storage events to sync across tabs
  const handleStorageChange = useCallback((e: StorageEvent) => {
    // Skip if we're in the middle of clearing
    if (clearingInProgress.current) {
      return
    }

    if (e.key === "notifications") {
      if (!e.newValue) {
        // If notifications were cleared in another tab
        setNotifications([])
      } else {
        try {
          // Parse the new notifications and update state
          const parsed = JSON.parse(e.newValue)
          const withDates = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
          setNotifications(withDates)
        } catch (error) {
          console.error("Failed to parse notifications from storage event:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    // Add event listener for storage events
    window.addEventListener("storage", handleStorageChange)

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [handleStorageChange])

  // Add this function to the NotificationProvider component
  const debugNotifications = useCallback(() => {
    console.log("Current notifications:", notifications)
    console.log("localStorage notifications:", localStorage.getItem("notifications"))
    console.log("isClearing:", isClearing)
    console.log("clearingInProgress:", clearingInProgress.current)
    console.log("hasInitialized:", hasInitialized.current)
  }, [notifications, isClearing])

  // Add it to the context value
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        clearRead,
        isClearing,
        debugNotifications, // Add this line
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
