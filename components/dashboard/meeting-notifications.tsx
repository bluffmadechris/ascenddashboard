"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns"
import { Bell, Calendar, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { loadData, saveData } from "@/lib/data-persistence"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MeetingNotification {
  id: string
  title: string
  description: string
  date: string
  priority: "low" | "medium" | "high"
  status: string
  eventId: string
  read: boolean
}

export function MeetingNotifications() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<MeetingNotification[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return

    // Load notifications
    const newsItems = loadData("news-items", [])
    if (Array.isArray(newsItems)) {
      const userNotifications = newsItems.filter(
        (item) => item.type === "meeting" && item.forUser === user.id && !item.read,
      ) as MeetingNotification[]

      // Sort by date (closest first)
      userNotifications.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setNotifications(userNotifications)
    }
  }, [user, refreshKey])

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    const newsItems = loadData("news-items", [])
    if (Array.isArray(newsItems)) {
      const updatedItems = newsItems.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
      saveData("news-items", updatedItems)
      setRefreshKey((prev) => prev + 1)

      toast({
        title: "Notification marked as read",
        description: "The meeting notification has been marked as read",
      })
    }
  }

  // Dismiss all notifications
  const dismissAll = () => {
    const newsItems = loadData("news-items", [])
    if (Array.isArray(newsItems)) {
      const updatedItems = newsItems.map((item) =>
        item.type === "meeting" && item.forUser === user?.id ? { ...item, read: true } : item,
      )
      saveData("news-items", updatedItems)
      setRefreshKey((prev) => prev + 1)

      toast({
        title: "All notifications dismissed",
        description: "All meeting notifications have been marked as read",
      })
    }
  }

  // Format date for display
  const formatMeetingDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)

      if (isToday(date)) {
        return `Today at ${format(date, "h:mm a")}`
      } else if (isTomorrow(date)) {
        return `Tomorrow at ${format(date, "h:mm a")}`
      } else if (date < addDays(new Date(), 7)) {
        return format(date, "EEEE 'at' h:mm a")
      } else {
        return format(date, "MMM d, yyyy 'at' h:mm a")
      }
    } catch (error) {
      return dateString
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      case "low":
        return "text-green-500"
      default:
        return "text-blue-500"
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Meeting Notifications</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={dismissAll}>
            Dismiss All
          </Button>
        </div>
        <CardDescription>
          You have {notifications.length} new meeting{notifications.length !== 1 ? "s" : ""} scheduled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-md">
                <div className={`mt-1 h-2 w-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead(notification.id)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {formatMeetingDate(notification.date)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href="/calendar">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
