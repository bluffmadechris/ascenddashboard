import { generateId } from "./uuid"
import type { Notification, NotificationType, ScheduledNotification } from "./notification-types"

// In-memory storage for notifications (in a real app, this would be a database)
let notifications: Notification[] = []
const scheduledNotifications: ScheduledNotification[] = []

// Event listeners for real-time updates
const listeners: { [key: string]: ((notification: Notification) => void)[] } = {}

// Add a notification listener
export function addNotificationListener(userId: string, callback: (notification: Notification) => void) {
  if (!listeners[userId]) {
    listeners[userId] = []
  }
  listeners[userId].push(callback)
  return () => {
    listeners[userId] = listeners[userId].filter((cb) => cb !== callback)
  }
}

// Notify listeners of a new notification
function notifyListeners(userId: string, notification: Notification) {
  if (listeners[userId]) {
    listeners[userId].forEach((callback) => callback(notification))
  }
}

// Create and send a notification
export function createNotification(
  userId: string,
  notificationData: Omit<Notification, "id" | "timestamp" | "read">,
): Notification {
  const notification: Notification = {
    id: generateId(),
    timestamp: new Date(),
    read: false,
    ...notificationData,
  }

  // Add to in-memory storage
  notifications.push(notification)

  // Notify listeners
  notifyListeners(userId, notification)

  return notification
}

// Create an invoice status notification
export function createInvoiceStatusNotification(
  userId: string,
  type: NotificationType,
  invoiceId: string,
  invoiceAmount: string,
  clientName: string,
  status: string,
): Notification {
  let title = ""
  let message = ""

  switch (type) {
    case "invoice_approved":
      title = "Invoice Approved"
      message = `Invoice #${invoiceId} for ${invoiceAmount} has been approved.`
      break
    case "invoice_rejected":
      title = "Invoice Rejected"
      message = `Invoice #${invoiceId} for ${invoiceAmount} has been rejected.`
      break
    case "invoice_paid":
      title = "Payment Received"
      message = `Payment of ${invoiceAmount} has been received for invoice #${invoiceId}.`
      break
    case "invoice_overdue":
      title = "Invoice Overdue"
      message = `Invoice #${invoiceId} for ${invoiceAmount} is now overdue.`
      break
    default:
      title = "Invoice Update"
      message = `There's an update to invoice #${invoiceId}.`
  }

  return createNotification(userId, {
    type,
    title,
    message,
    sourceId: invoiceId,
    sourceName: clientName,
    link: `/invoices/${invoiceId}`,
    priority: type === "invoice_overdue" ? "high" : "medium",
    metadata: {
      invoiceId,
      invoiceAmount,
      status,
      clientId: clientName,
    },
  })
}

// Create a website update notification
export function createWebsiteUpdateNotification(
  userId: string,
  type: NotificationType,
  updateType: string,
  updateDescription: string,
  updateLocation: string,
  updateAuthor: string,
): Notification {
  let title = ""

  switch (type) {
    case "website_content_update":
      title = "Content Updated"
      break
    case "website_design_update":
      title = "Design Updated"
      break
    case "website_maintenance":
      title = "Maintenance Scheduled"
      break
    case "website_feature_added":
      title = "New Feature Added"
      break
    default:
      title = "Website Updated"
  }

  return createNotification(userId, {
    type,
    title,
    message: updateDescription,
    sourceName: updateLocation,
    link: updateLocation.startsWith("/") ? updateLocation : undefined,
    priority: "low",
    metadata: {
      updateType,
      updateDescription,
      updateLocation,
      updateAuthor,
    },
  })
}

// Create an owner-initiated notification
export function createOwnerNotification(
  senderId: string,
  senderName: string,
  targetType: "all" | "role" | "team" | "individual",
  targetIds: string[],
  title: string,
  message: string,
  priority: "low" | "medium" | "high" | "urgent",
  requiresAcknowledgment = false,
  link?: string,
  scheduledFor?: Date,
): ScheduledNotification | Notification {
  const notificationData = {
    type: requiresAcknowledgment ? "owner_alert" : "owner_announcement",
    title,
    message,
    sourceName: senderName,
    sourceId: senderId,
    link,
    priority,
    metadata: {
      senderId,
      senderName,
      targetType,
      targetIds,
      requiresAcknowledgment,
      acknowledgedBy: [],
    },
    actions: requiresAcknowledgment ? [{ label: "Acknowledge", action: "acknowledge" }] : undefined,
  }

  // If scheduled for later
  if (scheduledFor && scheduledFor > new Date()) {
    const scheduledNotification: ScheduledNotification = {
      id: generateId(),
      notification: notificationData,
      scheduledFor,
      status: "scheduled",
      createdBy: senderId,
      createdAt: new Date(),
    }

    scheduledNotifications.push(scheduledNotification)
    return scheduledNotification
  }

  // Send immediately to all targets
  if (targetType === "all") {
    // In a real app, you would get all user IDs from the database
    const allUserIds = ["user1", "user2", "user3"] // Example
    return createNotification(allUserIds[0], notificationData)
  } else {
    // Send to specific targets
    // In a real app, you would resolve the target IDs based on roles or teams
    return createNotification(targetIds[0], notificationData)
  }
}

// Process scheduled notifications
export function processScheduledNotifications() {
  const now = new Date()
  const notificationsToSend = scheduledNotifications.filter((n) => n.status === "scheduled" && n.scheduledFor <= now)

  notificationsToSend.forEach((scheduled) => {
    // Update status
    scheduled.status = "sent"

    // In a real app, you would resolve the target IDs based on the targetType
    const targetIds = scheduled.notification.metadata?.targetIds || []

    // Send to each target
    targetIds.forEach((userId) => {
      createNotification(userId, scheduled.notification)
    })
  })

  return notificationsToSend.length
}

// Mark a notification as read
export function markNotificationAsRead(notificationId: string): boolean {
  const notification = notifications.find((n) => n.id === notificationId)
  if (notification) {
    notification.read = true
    return true
  }
  return false
}

// Acknowledge an owner notification
export function acknowledgeOwnerNotification(notificationId: string, userId: string): boolean {
  const notification = notifications.find((n) => n.id === notificationId)
  if (notification && notification.metadata?.requiresAcknowledgment) {
    if (!notification.metadata.acknowledgedBy) {
      notification.metadata.acknowledgedBy = []
    }
    if (!notification.metadata.acknowledgedBy.includes(userId)) {
      notification.metadata.acknowledgedBy.push(userId)
    }
    return true
  }
  return false
}

// Get notifications for a user
export function getUserNotifications(userId: string): Notification[] {
  // In a real app, you would filter notifications from the database
  return notifications.filter((n) => true) // Return all for demo
}

// Delete a notification
export function deleteNotification(notificationId: string): boolean {
  const initialLength = notifications.length
  notifications = notifications.filter((n) => n.id !== notificationId)
  return notifications.length < initialLength
}

// Cancel a scheduled notification
export function cancelScheduledNotification(scheduledId: string): boolean {
  const scheduled = scheduledNotifications.find((n) => n.id === scheduledId)
  if (scheduled && scheduled.status === "scheduled") {
    scheduled.status = "cancelled"
    return true
  }
  return false
}
