"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { loadData, saveData } from "@/lib/data-persistence"

export interface Notification {
    id: string
    title: string
    message: string
    type: "info" | "warning" | "success" | "error" | "security" | "system"
    date: string
    read: boolean
    requiresAcknowledgment?: boolean
    link?: {
        text: string
        url: string
    }
    from?: string
}

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearNotification: (id: string) => void
    clearAllNotifications: () => void
    acknowledgeNotification: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    // Load notifications from storage on mount
    useEffect(() => {
        const savedNotifications = loadData("notifications", []) as Notification[]
        setNotifications(savedNotifications)
        updateUnreadCount(savedNotifications)
    }, [])

    // Update unread count whenever notifications change
    const updateUnreadCount = (notifs: Notification[]) => {
        const count = notifs.filter(n => !n.read).length
        setUnreadCount(count)
    }

    // Save notifications to storage whenever they change
    const saveNotifications = (notifs: Notification[]) => {
        saveData("notifications", notifs)
        updateUnreadCount(notifs)
    }

    const addNotification = (notification: Omit<Notification, "id" | "date" | "read">) => {
        const newNotification: Notification = {
            ...notification,
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString(),
            read: false,
        }

        const updatedNotifications = [newNotification, ...notifications]
        setNotifications(updatedNotifications)
        saveNotifications(updatedNotifications)
    }

    const markAsRead = (id: string) => {
        const updatedNotifications = notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
        )
        setNotifications(updatedNotifications)
        saveNotifications(updatedNotifications)
    }

    const markAllAsRead = () => {
        const updatedNotifications = notifications.map(notification => ({
            ...notification,
            read: true
        }))
        setNotifications(updatedNotifications)
        saveNotifications(updatedNotifications)
    }

    const clearNotification = (id: string) => {
        const updatedNotifications = notifications.filter(notification => notification.id !== id)
        setNotifications(updatedNotifications)
        saveNotifications(updatedNotifications)
    }

    const clearAllNotifications = () => {
        setNotifications([])
        saveNotifications([])
    }

    const acknowledgeNotification = (id: string) => {
        const updatedNotifications = notifications.map(notification =>
            notification.id === id
                ? { ...notification, read: true, requiresAcknowledgment: false }
                : notification
        )
        setNotifications(updatedNotifications)
        saveNotifications(updatedNotifications)
    }

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearNotification,
                clearAllNotifications,
                acknowledgeNotification,
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