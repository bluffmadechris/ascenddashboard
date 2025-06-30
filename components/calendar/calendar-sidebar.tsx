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
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar } from "@/components/ui/avatar"
import type { CalendarEvent } from "@/lib/calendar-utils"

interface CalendarSidebarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onCreateEvent: () => void
  refreshEvents: () => void
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  onCreateEvent,
  refreshEvents,
  events,
  onEventClick,
}: CalendarSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarFilters, setCalendarFilters] = useState({
    meetings: true,
    personal: true,
    holidays: true,
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

  return (
    <div className="space-y-4">
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
            {getDayHeaders().map((day) => (
              <div key={day} className="py-1 font-medium">
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
                  "p-2 cursor-pointer rounded-full hover:bg-white/10",
                  isSameDay(day, selectedDate) && "bg-[#3b82f6] text-white",
                  isToday(day) && !isSameDay(day, selectedDate) && "border border-[#3b82f6]",
                )}
                onClick={() => onDateSelect(day)}
              >
                {format(day, "d")}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button className="w-full bg-[#3b82f6] hover:bg-[#2563eb]" onClick={onCreateEvent}>
        <Plus className="h-4 w-4 mr-2" />
        Create Event
      </Button>

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
                id="holidays"
                checked={calendarFilters.holidays}
                onCheckedChange={() => handleFilterChange("holidays")}
                className="border-[#ef4444] data-[state=checked]:bg-[#ef4444] data-[state=checked]:text-white"
              />
              <Label htmlFor="holidays" className="flex items-center text-white">
                <Badge className="mr-2 bg-[#ef4444] h-3 w-3 rounded-full p-0" />
                Holidays
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events section with ref for scrolling */}
      <div ref={upcomingEventsRef} id="upcoming-events" className="scroll-mt-4">
        <Card className="bg-[#0f1729] text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[240px] px-4 py-2">
              <div className="space-y-3 pr-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-md p-3 transition-colors cursor-pointer hover:bg-white/5"
                    style={{ backgroundColor: `${event.color}20` }}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-start">
                      <div
                        className="w-1 h-full rounded-full self-stretch mr-2 flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <div className="flex items-center mt-1 text-xs text-gray-300">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>
                            {format(parseISO(event.start), "EEE, MMM d")} · {formatEventTime(event.start)}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-300 mt-1">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>No upcoming events</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="px-4 py-2 border-t border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-300 hover:text-white hover:bg-white/10"
                onClick={() => setShowAllEvents(true)}
              >
                View All Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Events Dialog */}
      <Dialog open={showAllEvents} onOpenChange={setShowAllEvents}>
        <DialogContent className="bg-[#0f1729] text-white border-none max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">All Upcoming Events</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-120px)] pr-4">
            <div className="space-y-4 py-2">
              {allUpcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No upcoming events</p>
                </div>
              ) : (
                allUpcomingEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="bg-[#1a2542] border-none cursor-pointer hover:bg-[#243050] transition-colors"
                    onClick={() => {
                      setShowAllEvents(false)
                      onEventClick(event)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1.5 h-full rounded-full self-stretch flex-shrink-0 mt-1"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <Badge
                              className="ml-2"
                              style={{
                                backgroundColor: event.color,
                                color: "white",
                              }}
                            >
                              {event.type}
                            </Badge>
                          </div>

                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center text-sm text-gray-300">
                              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>
                                {format(parseISO(event.start), "EEEE, MMMM d, yyyy")} · {formatEventTime(event.start)}{" "}
                                to {formatEventTime(event.end)}
                              </span>
                            </div>

                            {event.location && (
                              <div className="flex items-center text-sm text-gray-300">
                                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.assignedTo && event.assignedTo.length > 0 && (
                              <div className="flex items-center text-sm text-gray-300 mt-1">
                                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                                <div className="flex items-center">
                                  <div className="flex -space-x-2 mr-2">
                                    {event.assignedTo.slice(0, 3).map((userId, index) => (
                                      <Avatar key={userId} className="h-6 w-6 border border-[#0f1729]">
                                        <div className="bg-gray-600 h-full w-full flex items-center justify-center text-xs">
                                          {userId.charAt(0).toUpperCase()}
                                        </div>
                                      </Avatar>
                                    ))}
                                  </div>
                                  {event.assignedTo.length > 3 && (
                                    <span className="text-xs text-gray-400">+{event.assignedTo.length - 3} more</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {event.description && (
                              <div className="mt-2 text-sm text-gray-300 line-clamp-2">{event.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
