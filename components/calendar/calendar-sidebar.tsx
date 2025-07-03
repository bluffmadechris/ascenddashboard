"use client"

import { useState, useRef } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  isFuture,
  isEqual,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Calendar, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { EmployeeCalendarSelector } from "./employee-calendar-selector"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { getUserCalendarColor } from "@/lib/calendar-utils"

interface CalendarSidebarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onCreateEvent: () => void
  refreshEvents: () => void
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  selectedEmployees?: string[]
  onEmployeeToggle?: (userId: string) => void
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  onCreateEvent,
  refreshEvents,
  events,
  onEventClick,
  selectedEmployees = [],
  onEmployeeToggle,
}: CalendarSidebarProps) {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarFilters, setCalendarFilters] = useState({
    meetings: true,
    personal: true,
    holidays: true,
    availability: true,
  })
  const [showAllEvents, setShowAllEvents] = useState(false)

  // Reference to the upcoming events section
  const upcomingEventsRef = useRef<HTMLDivElement>(null)

  // Function to scroll to upcoming events
  const scrollToUpcomingEvents = () => {
    upcomingEventsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Get days for the mini calendar
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }

  // Get day of week headers
  const getDayHeaders = () => {
    return ["S", "M", "T", "W", "T", "F", "S"]
  }

  // Handle filter change
  const handleFilterChange = (filter: keyof typeof calendarFilters) => {
    setCalendarFilters({
      ...calendarFilters,
      [filter]: !calendarFilters[filter],
    })
    refreshEvents()
  }

  // Format time from ISO string
  const formatEventTime = (isoString: string) => {
    try {
      const date = parseISO(isoString)
      return format(date, "h:mm a")
    } catch (error) {
      return "Invalid time"
    }
  }

  // Get events for selected date
  const selectedDateEvents = events.filter((event) => {
    try {
      const eventDate = parseISO(event.start)
      return isSameDay(eventDate, selectedDate)
    } catch (error) {
      return false
    }
  })

  // Get upcoming events (limited to 5 for the sidebar)
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.start)
      return isFuture(eventDate) || isEqual(eventDate, new Date())
    })
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
    .slice(0, 5)

  // Get all upcoming events for the modal
  const allUpcomingEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.start)
      return isFuture(eventDate) || isEqual(eventDate, new Date())
    })
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())

  // Check if date has events
  const hasEventsOnDate = (date: Date) => {
    return events.some((event) => {
      try {
        const eventDate = parseISO(event.start)
        return isSameDay(eventDate, date)
      } catch (error) {
        return false
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Mini Calendar */}
      <Card className="bg-[#0f1729] text-white border-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="text-white hover:bg-white/10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="text-white hover:bg-white/10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mini calendar */}
          <div className="grid grid-cols-7 text-center text-xs">
            {getDayHeaders().map((day, index) => (
              <div key={`day-header-${index}`} className="py-1 font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-xs mt-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: getDaysInMonth()[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {/* Days of the month */}
            {getDaysInMonth().map((day) => (
              <div
                key={day.toString()}
                className={cn(
                  "p-2 cursor-pointer rounded-full hover:bg-white/10 relative",
                  isSameDay(day, selectedDate) && "bg-[#3b82f6] text-white",
                  isToday(day) && !isSameDay(day, selectedDate) && "border border-[#3b82f6]",
                )}
                onClick={() => onDateSelect(day)}
              >
                {format(day, "d")}
                {hasEventsOnDate(day) && (
                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-[#22c55e] rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Event Button */}
      <Button className="w-full bg-[#3b82f6] hover:bg-[#2563eb]" onClick={onCreateEvent}>
        <Plus className="h-4 w-4 mr-2" />
        Create Event
      </Button>

      {/* Employee Calendar Selector - Only for owners/managers */}
      {onEmployeeToggle && (
        <EmployeeCalendarSelector
          selectedEmployees={selectedEmployees}
          onEmployeeToggle={onEmployeeToggle}
          events={events}
        />
      )}

      {/* Calendar Filters */}
      <Card className="bg-[#0f1729] text-white border-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">My Calendars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="meetings"
                checked={calendarFilters.meetings}
                onCheckedChange={() => handleFilterChange("meetings")}
                className="border-[#3b82f6] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-white"
              />
              <Label htmlFor="meetings" className="flex items-center text-white">
                <Badge className="mr-2 bg-[#3b82f6] h-3 w-3 rounded-full p-0" />
                Meetings
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="personal"
                checked={calendarFilters.personal}
                onCheckedChange={() => handleFilterChange("personal")}
                className="border-[#22c55e] data-[state=checked]:bg-[#22c55e] data-[state=checked]:text-white"
              />
              <Label htmlFor="personal" className="flex items-center text-white">
                <Badge className="mr-2 bg-[#22c55e] h-3 w-3 rounded-full p-0" />
                Personal
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availability"
                checked={calendarFilters.availability}
                onCheckedChange={() => handleFilterChange("availability")}
                className="border-[#f59e0b] data-[state=checked]:bg-[#f59e0b] data-[state=checked]:text-white"
              />
              <Label htmlFor="availability" className="flex items-center text-white">
                <Badge className="mr-2 bg-[#f59e0b] h-3 w-3 rounded-full p-0" />
                Availability
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDateEvents.length > 0 && (
        <Card className="bg-[#0f1729] text-white border-none">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {format(selectedDate, "MMM d")} Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-start space-x-2">
                      <div
                        className="w-2 h-2 mt-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: event.color || getUserCalendarColor(event.createdBy)
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
                        <div className="flex items-center space-x-2 text-xs text-white/60">
                          <Clock className="h-3 w-3" />
                          <span>{formatEventTime(event.start)}</span>
                          {event.location && (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card className="bg-[#0f1729] text-white border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium" ref={upcomingEventsRef} id="upcoming-events">
              Upcoming Events
            </CardTitle>
            {allUpcomingEvents.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllEvents(true)}
                className="text-xs text-white/70 hover:text-white hover:bg-white/10"
              >
                View All ({allUpcomingEvents.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start space-x-2">
                    <div
                      className="w-2 h-2 mt-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: event.color || getUserCalendarColor(event.createdBy)
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title}</p>
                      <div className="flex items-center space-x-2 text-xs text-white/60">
                        <Clock className="h-3 w-3" />
                        <span>{format(parseISO(event.start), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No upcoming events</p>
          )}
        </CardContent>
      </Card>

      {/* All Upcoming Events Dialog */}
      <Dialog open={showAllEvents} onOpenChange={setShowAllEvents}>
        <DialogContent className="sm:max-w-[500px] bg-[#0f1729] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>All Upcoming Events ({allUpcomingEvents.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {allUpcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => {
                    onEventClick(event)
                    setShowAllEvents(false)
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-3 h-3 mt-1 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: event.color || getUserCalendarColor(event.createdBy)
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{event.title}</p>
                      <div className="flex items-center space-x-2 text-sm text-white/60 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(parseISO(event.start), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-2 text-sm text-white/60 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-white/60 mt-1">
                          <Users className="h-4 w-4" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
