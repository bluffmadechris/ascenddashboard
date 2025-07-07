"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { playNotificationSound, isSoundEnabled, toggleNotificationSound } from "@/lib/sound-utils"

export interface Notification {
    id: number
    user_id: number
    title: string
    message: string
    type: "info" | "warning" | "success" | "error" | "security" | "system" | "meeting_request" | "meeting_request_update" | "meeting_request_deleted"
    is_read: boolean
    created_at: string
    sound_enabled?: boolean
    data?: any
}

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    refreshNotifications: () => Promise<void>
    markAsRead: (id: number) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (id: number) => Promise<void>
    setNotifications: (notifications: Notification[]) => void
    soundEnabled: boolean
    toggleSound: (enabled: boolean) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const { user, isApiConnected } = useAuth()
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastNotificationCount = useRef(0)

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.is_read).length

    // Initialize sound preference
    useEffect(() => {
        setSoundEnabled(isSoundEnabled())
    }, [])

    // Toggle sound preference
    const toggleSound = (enabled: boolean) => {
        setSoundEnabled(enabled)
        toggleNotificationSound(enabled)
    }

    // Load notifications from API
    const refreshNotifications = async () => {
        if (!isApiConnected || !user) {
            return
        }

        setIsLoading(true)
        try {
            const response = await apiClient.getNotifications()
            if (response.success && response.data?.notifications) {
                const newNotifications = response.data.notifications

                // Check if we have new notifications
                const hasNewNotifications = newNotifications.length > lastNotificationCount.current

                if (hasNewNotifications && soundEnabled) {
                    // Play sound for new notifications
                    const newUnreadNotifications = newNotifications.filter((n: Notification) => !n.is_read)
                    const previousUnreadCount = notifications.filter(n => !n.is_read).length

                    if (newUnreadNotifications.length > previousUnreadCount) {
                        // Check if any of the new notifications are important types that should play sound
                        const importantTypes = ['meeting_request', 'meeting_request_update', 'security', 'system', 'error']
                        const hasImportantNotifications = newUnreadNotifications.some(n => importantTypes.includes(n.type))

                        if (hasImportantNotifications) {
                            playNotificationSound()
                        }
                    }
                }

                setNotifications(newNotifications)
                lastNotificationCount.current = newNotifications.length
            }
        } catch (error) {
            console.error('Failed to load notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Set up automatic polling for new notifications
    useEffect(() => {
        if (isApiConnected && user) {
            // Initial load
            refreshNotifications()

            // Set up polling every 10 seconds for better responsiveness
            pollingIntervalRef.current = setInterval(refreshNotifications, 10000)
        } else {
            // Clear notifications if not connected or no user
            setNotifications([])
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
        }

        // Cleanup on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
        }
    }, [isApiConnected, user])

    // Mark a notification as read
    const markAsRead = async (id: number) => {
        try {
            const response = await apiClient.markNotificationAsRead(id)
            if (response.success) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                )
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const response = await apiClient.markAllNotificationsAsRead()
            if (response.success) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, is_read: true }))
                )
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error)
        }
    }

    // Delete a notification
    const deleteNotification = async (id: number) => {
        try {
            const response = await apiClient.deleteNotification(id)
            if (response.success) {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                refreshNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                setNotifications,
                soundEnabled,
                toggleSound,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationsContext)
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationsProvider")
    }
    return context
} 