"use client"

import { useEffect, useState } from "react"
import { useNotifications } from "@/lib/api-notifications-context"
import { formatRelativeTime, getNotificationIcon } from "@/lib/notification-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import all Lucide icons
const LucideIcon = dynamic(
  () =>
    import("lucide-react").then((mod) => {
      // @ts-ignore - This is a workaround for dynamic icon imports
      return ({ name, ...props }: { name: string }) => {
        const Icon = mod[name]
        return Icon ? <Icon {...props} /> : null
      }
    }),
  { ssr: false },
)

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, clearRead, refreshNotifications } =
    useNotifications()
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    // Refresh notifications when the page loads
    refreshNotifications()
  }, [])

  const filteredNotifications = filter === "all" ? notifications : notifications.filter((n) => !n.read)

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">View and manage your notifications</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => clearRead()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAll()
              // Force a refresh of the notifications list
              refreshNotifications()
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            {filter === "all"
              ? `Showing all notifications (${notifications.length})`
              : `Showing unread notifications (${unreadCount})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.read && "bg-muted/30",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <LucideIcon name={getNotificationIcon(notification.type)} className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className={cn("font-medium", !notification.read && "font-semibold")}>{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{formatRelativeTime(notification.timestamp)}</p>
                    </div>
                    <p className="mt-1 text-muted-foreground">{notification.message}</p>
                    {(notification.sourceId || notification.sourceName) && (
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        {notification.sourceId && (
                          <Badge variant="outline" className="mr-2">
                            {notification.sourceId}
                          </Badge>
                        )}
                        {notification.sourceName && <span>{notification.sourceName}</span>}
                      </div>
                    )}
                  </div>
                  {!notification.read && <div className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Check className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === "all" ? "You don't have any notifications." : "You don't have any unread notifications."}
              </p>
              {filter === "unread" && (
                <Button variant="link" className="mt-4" onClick={() => setFilter("all")}>
                  View all notifications
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to conditionally join class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
