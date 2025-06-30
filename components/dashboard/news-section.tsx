"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Clock, MessageSquare, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadData, saveData } from "@/lib/data-persistence"
import { format, isToday, isThisWeek, parseISO } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUser } from "@/lib/hooks/use-user"
import { getMeetingRequestsForUser } from "@/lib/meeting-request"

// Types for news items
type NewsItemType = "meeting" | "task" | "announcement"

interface NewsItem {
  id: string
  type: NewsItemType
  title: string
  description: string
  date: string
  priority?: "low" | "medium" | "high"
  status?: "pending" | "completed" | "cancelled"
  link?: string
  relatedTo?: string
  forUser?: string
  eventId?: string
  read?: boolean
}

// Rename the component to better reflect its purpose
export function UpcomingEvents() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [timeFrame, setTimeFrame] = useState<"today" | "week" | "all">("all")
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useUser()

  // Load news items from various sources
  useEffect(() => {
    const loadNewsItems = () => {
      const items: NewsItem[] = []

      // Load meeting requests for the current user
      if (user) {
        try {
          const meetingRequestsAsRequester = getMeetingRequestsForUser(user.id, 'requester')
          const meetingRequestsAsOwner = getMeetingRequestsForUser(user.id, 'owner')
          const allMeetingRequests = [...meetingRequestsAsRequester, ...meetingRequestsAsOwner]

          allMeetingRequests.forEach((request) => {
            // For scheduled meetings, use the scheduled date
            const eventDate = request.status === 'scheduled' && request.scheduledDate
              ? request.scheduledDate
              : request.createdAt

            // Determine the title based on user's role in the meeting
            const title = user.id === request.requesterId
              ? `Meeting with ${request.ownerName}: ${request.subject}`
              : `Meeting request from ${request.requesterName}: ${request.subject}`

            items.push({
              id: `meeting-${request.id}`,
              type: "meeting",
              title: title,
              description: request.description || "No details provided",
              date: eventDate,
              status: request.status === 'scheduled' ? 'confirmed' : request.status,
              link: "/meeting-requests",
              relatedTo: user.id === request.requesterId ? request.ownerName : request.requesterName,
            })
          })
        } catch (error) {
          console.error('Error loading meeting requests:', error)
        }
      }

      // Load scheduled meetings from news-items
      const newsItems = loadData("news-items", [])
      if (Array.isArray(newsItems)) {
        // If user is not owner, only show items for this user
        const filteredNewsItems =
          user?.role === "owner"
            ? newsItems.filter((item) => item.type === "meeting")
            : newsItems.filter((item) => item.type === "meeting" && (!item.forUser || item.forUser === user?.id))

        items.push(...filteredNewsItems)
      }

      // Load calendar events
      const calendarEvents = loadData("calendar-events", [])
      if (Array.isArray(calendarEvents)) {
        // Only include upcoming events (next 30 days)
        const now = new Date()
        const thirtyDaysLater = new Date(now)
        thirtyDaysLater.setDate(now.getDate() + 30)

        const relevantEvents = calendarEvents.filter((event) => {
          // Skip if not assigned to current user
          if (user && !event.assignedTo?.includes(user.id)) return false

          const eventDate = new Date(event.start)
          return eventDate >= now && eventDate <= thirtyDaysLater
        })

        relevantEvents.forEach((event) => {
          // Skip if already included from news-items
          if (items.some((item) => item.eventId === event.id)) return

          items.push({
            id: `calendar-${event.id}`,
            type: "meeting",
            title: event.title,
            description: event.description || "No description provided",
            date: event.start,
            priority: event.priority || "medium",
            status: "pending",
            link: "/calendar",
            relatedTo: event.title,
            eventId: event.id,
          })
        })
      }

      // Sort by date (soonest first)
      items.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setNewsItems(items)
    }

    loadNewsItems()
  }, [refreshKey, user])

  // Mark news item as read
  const markAsRead = (itemId: string) => {
    const newsItems = loadData("news-items", [])
    if (Array.isArray(newsItems)) {
      const updatedItems = newsItems.map((item) => (item.id === itemId ? { ...item, read: true } : item))
      saveData("news-items", updatedItems)
      setRefreshKey((prev) => prev + 1)
    }
  }

  // Filter news items - only by time frame now
  const filteredItems = newsItems.filter((item) => {
    // Filter by time frame
    if (timeFrame === "today") {
      return isToday(parseISO(item.date))
    } else if (timeFrame === "week") {
      return isThisWeek(parseISO(item.date))
    }

    return true
  })

  // Get icon for news item type
  const getItemIcon = (type: NewsItemType) => {
    switch (type) {
      case "meeting":
        return <MessageSquare className="h-4 w-4" />
      case "task":
        return <CheckSquare className="h-4 w-4" />
      case "announcement":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Get color for news item priority
  const getPriorityColor = (priority?: string) => {
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

  // Get badge for news item status
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      if (isToday(date)) {
        return `Today, ${format(date, "h:mm a")}`
      }
      return format(date, "MMM d, yyyy 'at' h:mm a")
    } catch (error) {
      return dateString
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your scheduled meetings and events</CardDescription>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setRefreshKey((prev) => prev + 1)}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh events</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setTimeFrame(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="all">All Upcoming</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No upcoming events</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No events or meetings found for the selected time period.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden ${item.read === false ? "border-primary" : ""}`}
                  onClick={() => {
                    if (item.id.startsWith("meeting-") && !item.read) {
                      markAsRead(item.id)
                    }
                  }}
                >
                  <div className="flex">
                    <div className={`w-1 ${getPriorityColor(item.priority)}`} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-medium">Event</span>
                          {getStatusBadge(item.status)}
                          {item.read === false && (
                            <Badge variant="default" className="ml-2">
                              New
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                      </div>
                      <h3 className="text-base font-semibold mt-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      {item.relatedTo && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Related to: <span className="font-medium">{item.relatedTo}</span>
                        </p>
                      )}
                      {item.link && (
                        <div className="mt-3">
                          <Button variant="link" size="sm" className="h-auto p-0" asChild>
                            <a href={item.link}>View details</a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">Showing {filteredItems.length} upcoming events</div>
        <Button variant="outline" size="sm" asChild>
          <a href="/calendar">View Calendar</a>
        </Button>
      </CardFooter>
    </Card>
  )
}
