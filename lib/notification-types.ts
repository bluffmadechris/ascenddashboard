export type NotificationType =
  | "invoice_approved"
  | "invoice_rejected"
  | "invoice_paid"
  | "invoice_overdue"
  | "invoice_created"
  | "invoice_updated"
  | "website_content_update"
  | "website_design_update"
  | "website_maintenance"
  | "website_feature_added"
  | "owner_announcement"
  | "owner_direct_message"
  | "owner_alert"
  | "meeting_scheduled"
  | "meeting_canceled"
  | "meeting_reminder"
  | "task_assigned"
  | "task_completed"
  | "task_deadline_approaching"
  | "user_role_updated"
  | "system_update"
  | "system_maintenance"
  | "system_error"

export interface NotificationAction {
  label: string
  action: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date | string // Allow both Date objects and string timestamps
  read: boolean
  sourceId?: string
  sourceName?: string
  link?: string
  priority: "low" | "medium" | "high"
  metadata?: Record<string, any>
  actions?: NotificationAction[]
}
