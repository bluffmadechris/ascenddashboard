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
  Trash,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useNotifications } from "@/lib/api-notifications-context"
import type { Notification } from "@/lib/api-notifications-context"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { testNotificationSound, getAudioDebugInfo } from "@/lib/sound-utils"

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
    soundEnabled,
    toggleSound,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Sound Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toggleSound(!soundEnabled)}>
                    {soundEnabled ? (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Disable Sound
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Enable Sound
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      console.log('[UI] Test sound button clicked')

                      // Get debug info before test
                      const debugInfo = getAudioDebugInfo()
                      console.log('[UI] Audio debug info:', debugInfo)

                      try {
                        const success = await testNotificationSound()
                        console.log('[UI] Test sound result:', success)

                        if (success) {
                          toast("🔊 Sound test successful!", {
                            description: "Notification sound is working properly"
                          })
                        } else {
                          // Get debug info after failed test
                          const failedDebugInfo = getAudioDebugInfo()
                          console.log('[UI] Failed test debug info:', failedDebugInfo)

                          toast("❌ Sound test failed", {
                            description: "Check browser console for details. Try refreshing the page and testing again."
                          })
                        }
                      } catch (error) {
                        console.error('[UI] Test sound error:', error)
                        toast("❌ Sound test error", {
                          description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        })
                      }
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Test Sound
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNotifications}
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
                      "group relative rounded-lg border p-4 transition-colors cursor-pointer",
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
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
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
  const { notifications, markAsRead } = useNotifications()

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId)
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
          {notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg",
                !notification.is_read && "bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-primary/10">
                  {getNotificationIcon(notification.type)}
                </div>
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  Mark as Read
                </Button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No new notifications</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
