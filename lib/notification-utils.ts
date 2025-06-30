import { loadData, saveData } from "./data-persistence"
import { generateId } from "./uuid"

// Define notification types
export type NotificationType =
  | "invoice_approved"
  | "invoice_rejected"
  | "payment_received"
  | "team_added"
  | "meeting_scheduled"
  | "meeting_canceled"
  | "task_assigned"
  | "task_completed"
  | "client_added"
  | "contract_signed"
  | "system"

// Define notification interface
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  sourceId?: string
  sourceName?: string
  timestamp: string
  read: boolean
  userId: string
  link?: string
}

// Load notifications from storage
export function loadNotifications(userId: string): Notification[] {
  try {
    const notifications = loadData(`notifications-${userId}`, [])
    return Array.isArray(notifications) ? notifications : []
  } catch (error) {
    console.error("Error loading notifications:", error)
    return []
  }
}

// Save notifications to storage
export function saveNotifications(userId: string, notifications: Notification[]): void {
  try {
    saveData(`notifications-${userId}`, notifications)
  } catch (error) {
    console.error("Error saving notifications:", error)
  }
}

// Add a new notification
export function addNotification(
  userId: string,
  notification: Omit<Notification, "id" | "timestamp" | "read" | "userId">,
): Notification {
  try {
    const notifications = loadNotifications(userId)

    const newNotification: Notification = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      read: false,
      userId,
      ...notification,
    }

    // Add to beginning of array (newest first)
    notifications.unshift(newNotification)

    saveNotifications(userId, notifications)
    return newNotification
  } catch (error) {
    console.error("Error adding notification:", error)
    throw error
  }
}

// Mark a notification as read
export function markNotificationAsRead(userId: string, notificationId: string): boolean {
  try {
    const notifications = loadNotifications(userId)
    const index = notifications.findIndex((n) => n.id === notificationId)

    if (index === -1) return false

    notifications[index].read = true
    saveNotifications(userId, notifications)
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Mark all notifications as read
export function markAllNotificationsAsRead(userId: string): boolean {
  try {
    const notifications = loadNotifications(userId)
    const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))
    saveNotifications(userId, updatedNotifications)
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}

// Clear all notifications
export function clearAllNotifications(userId: string): boolean {
  try {
    saveNotifications(userId, [])
    return true
  } catch (error) {
    console.error("Error clearing notifications:", error)
    return false
  }
}

// Clear read notifications
export function clearReadNotifications(userId: string): boolean {
  try {
    const notifications = loadNotifications(userId)
    const unreadNotifications = notifications.filter((n) => !n.read)
    saveNotifications(userId, unreadNotifications)
    return true
  } catch (error) {
    console.error("Error clearing read notifications:", error)
    return false
  }
}

// Get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "invoice_approved":
    case "invoice_rejected":
    case "payment_received":
      return "receipt"
    case "team_added":
      return "users"
    case "meeting_scheduled":
    case "meeting_canceled":
      return "calendar"
    case "task_assigned":
    case "task_completed":
      return "check-square"
    case "client_added":
      return "user-plus"
    case "contract_signed":
      return "file-text"
    case "system":
    default:
      return "bell"
  }
}

// Format relative time
export function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
  }

  // Format as date for older notifications
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  })
}

// Generate sample notifications for testing
export function generateSampleNotifications(userId: string): Notification[] {
  const now = new Date()

  return [
    {
      id: generateId(),
      type: "invoice_approved",
      title: "Invoice Approved",
      message: "Your invoice has been approved and is ready for payment.",
      sourceId: "INV-2023-042",
      sourceName: "Capri",
      timestamp: new Date(now.getTime() - 10 * 60000).toISOString(), // 10 minutes ago
      read: false,
      userId,
      link: "/invoices",
    },
    {
      id: generateId(),
      type: "meeting_scheduled",
      title: "New Meeting Scheduled",
      message: "A new meeting has been scheduled with your team.",
      sourceId: "MTG-2023-015",
      sourceName: "Weekly Strategy Review",
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
      read: false,
      userId,
      link: "/calendar",
    },
    {
      id: generateId(),
      type: "task_assigned",
      title: "New Task Assigned",
      message: "You have been assigned a new task to complete.",
      sourceId: "TSK-2023-089",
      sourceName: "Update Client Presentation",
      timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(), // 5 hours ago
      read: true,
      userId,
      link: "/tasks-projects",
    },
    {
      id: generateId(),
      type: "team_added",
      title: "Added to Team",
      message: "You have been added to a new team.",
      sourceId: "TM-2023-004",
      sourceName: "Content Creation Team",
      timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(), // 1 day ago
      read: true,
      userId,
      link: "/team-management",
    },
    {
      id: generateId(),
      type: "payment_received",
      title: "Payment Received",
      message: "A payment has been received for your invoice.",
      sourceId: "PMT-2023-031",
      sourceName: "INV-2023-038",
      timestamp: new Date(now.getTime() - 3 * 24 * 3600000).toISOString(), // 3 days ago
      read: true,
      userId,
      link: "/invoices",
    },
  ]
}
