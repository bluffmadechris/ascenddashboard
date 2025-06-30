"use client"

import { useState, useEffect } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import {
  type CalendarEvent,
  getUserEvents,
  getAvailabilityEvents,
  getUnavailableSlotEvents,
} from "@/lib/calendar-utils"
import { IntegratedAvailabilityCalendar } from "@/components/calendar/integrated-availability-calendar"
import { CalendarDayView } from "@/components/calendar/calendar-day-view"
import { CalendarWeekView } from "@/components/calendar/calendar-week-view"
import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view"
import { UserAvailabilityDisplay } from "@/components/calendar/user-availability-display"

interface TeamMemberCalendarProps {
  initialUserId?: string
}

export function TeamMemberCalendar({ initialUserId }: TeamMemberCalendarProps) {
  const { users } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || "")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month")
  const [refreshKey, setRefreshKey] = useState(0)

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Load selected user's events and availability
  useEffect(() => {
    if (!selectedUserId) return

    try {
      // Get user's calendar events
      const userEvents = getUserEvents(selectedUserId)

      // Get availability events
      const availabilityEvents = getAvailabilityEvents(selectedUserId)

      // Get unavailable slot events
      const unavailableEvents = getUnavailableSlotEvents(selectedUserId)

      // Combine all events
      setEvents([...userEvents, ...availabilityEvents, ...unavailableEvents])
    } catch (error) {
      console.error("Error loading team member calendar:", error)
    }
  }, [selectedUserId, refreshKey])

  // Navigate to previous month/week/day
  const goToPrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, -7))
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  // Navigate to next month/week/day
  const goToNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, 7))
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    // In a real app, this would open an event details dialog
    console.log("Event clicked:", event)
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    if (view === "month") {
      setView("day")
    }
  }

  // Handle availability change
  const handleAvailabilityChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Format the header date based on the current view
  const formatHeaderDate = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy")
    } else if (view === "week") {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
    } else if (view === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy")
    } else {
      return format(currentDate, "MMMM yyyy")
    }
  }

  // Get the selected user
  const selectedUser = users.find((user) => user.id === selectedUserId)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Member Calendar
          </CardTitle>

          {/* Team Member Selector */}
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {selectedUser ? (
        <CardContent className="p-0 pt-4">
          {/* Selected User Info */}
          <div className="px-6 pb-4 flex items-center gap-3 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.name} />
              <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedUser.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1).replace(/_/g, " ")}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Viewing Schedule
            </Badge>
          </div>

          {/* Calendar Controls */}
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-medium ml-2">{formatHeaderDate()}</h3>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar Views */}
          <div className="h-[600px] overflow-hidden">
            {view === "month" && (
              <IntegratedAvailabilityCalendar
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onAvailabilityChange={handleAvailabilityChange}
              />
            )}
            {view === "week" && (
              <CalendarWeekView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onCreateEventAtTime={() => {}}
              />
            )}
            {view === "day" && (
              <CalendarDayView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEventClick}
                onCreateEventAtTime={() => {}}
              />
            )}
            {view === "agenda" && (
              <CalendarAgendaView currentDate={currentDate} events={events} onEventClick={handleEventClick} />
            )}
          </div>

          {/* Availability Summary */}
          <div className="p-4 border-t">
            <UserAvailabilityDisplay userIds={[selectedUserId]} date={currentDate} />
          </div>
        </CardContent>
      ) : (
        <CardContent className="py-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Select a team member</h3>
          <p className="text-sm text-muted-foreground">Choose a team member to view their calendar and availability.</p>
        </CardContent>
      )}
    </Card>
  )
}

// Helper function for week view
function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day
  result.setDate(diff)
  return result
}

// Helper function for week view
function endOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() + (6 - day)
  result.setDate(diff)
  return result
}

// Helper function to add days
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
