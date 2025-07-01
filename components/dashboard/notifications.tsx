"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  X,
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Info,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useNotifications } from "@/lib/api-notifications-context"
import type { Notification } from "@/lib/api-notifications-context"
import { format } from "date-fns"
import { api } from "@/lib/api-client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "info":
      return <Info className="h-4 w-4" />
    case "warning":
      return <AlertTriangle className="h-4 w-4" />
    case "success":
      return <CheckCircle className="h-4 w-4" />
    case "error":
      return <XCircle className="h-4 w-4" />
    case "security":
      return <Shield className="h-4 w-4" />
    case "system":
      return <Settings className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

export function NotificationsMenu() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    setNotifications
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio("/notification-sound.mp3")

    // Set up WebSocket or polling for real-time notifications
    const checkNewNotifications = async () => {
      try {
        const response = await api.get('/notifications/unread')
        const newNotifications = response.data

        // If there are new notifications and they're different from current ones
        if (newNotifications.length > notifications.length) {
          setNotifications(newNotifications)

          // Play sound for notifications that have sound enabled
          const soundEnabledNotifications = newNotifications.filter(
            (n: any) => n.sound_enabled
          )

          if (soundEnabledNotifications.length > 0 && audioRef.current) {
            audioRef.current.play().catch(console.error)
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    // Poll for new notifications every 30 seconds
    const interval = setInterval(checkNewNotifications, 30000)

    // Initial check
    checkNewNotifications()

    return () => {
      clearInterval(interval)
      if (audioRef.current) {
        audioRef.current = null
      }
    }
  }, [notifications, setNotifications])

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[380px] rounded-md border bg-card p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  markAllAsRead()
                  setIsOpen(false)
                }}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // For now, just refresh notifications
                  refreshNotifications()
                  setIsOpen(false)
                }}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up! Check back later for new notifications.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative rounded-lg border p-4 transition-colors",
                      notification.is_read ? "bg-background" : "bg-muted/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-2 bg-primary/10">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(notification.created_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export function Notifications() {
  const { notifications, setNotifications } = useNotifications()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio("/notification-sound.mp3")

    // Set up WebSocket or polling for real-time notifications
    const checkNewNotifications = async () => {
      try {
        const response = await api.get('/notifications/unread')
        const newNotifications = response.data

        // If there are new notifications and they're different from current ones
        if (newNotifications.length > notifications.length) {
          setNotifications(newNotifications)

          // Play sound for notifications that have sound enabled
          const soundEnabledNotifications = newNotifications.filter(
            (n: any) => n.sound_enabled
          )

          if (soundEnabledNotifications.length > 0 && audioRef.current) {
            audioRef.current.play().catch(console.error)
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    // Poll for new notifications every 30 seconds
    const interval = setInterval(checkNewNotifications, 30000)

    // Initial check
    checkNewNotifications()

    return () => {
      clearInterval(interval)
      if (audioRef.current) {
        audioRef.current = null
      }
    }
  }, [notifications, setNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      toast.error("Failed to mark notification as read")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p>{notification.content}</p>
                <p className="text-sm text-gray-500">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Mark as Read
              </button>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-center text-gray-500">No new notifications</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
