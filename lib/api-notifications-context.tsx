"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export interface Notification {
    id: number
    user_id: number
    title: string
    message: string
    type: "info" | "warning" | "success" | "error" | "security" | "system"
    is_read: boolean
    created_at: string
}

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    refreshNotifications: () => Promise<void>
    markAsRead: (id: number) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (id: number) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { user, isApiConnected } = useAuth()

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.is_read).length

    // Load notifications from API
    const refreshNotifications = async () => {
        if (!isApiConnected || !user) {
            return
        }

        setIsLoading(true)
        try {
            const response = await apiClient.getNotifications()
            if (response.success && response.data?.notifications) {
                setNotifications(response.data.notifications)
            }
        } catch (error) {
            console.error('Failed to load notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Load notifications on mount and when user changes
    useEffect(() => {
        if (isApiConnected && user) {
            refreshNotifications()
        } else {
            // Clear notifications if not connected or no user
            setNotifications([])
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