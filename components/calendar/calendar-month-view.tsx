"use client"

import { useState } from "react"
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isValid,
} from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { getUserCalendarColor } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Clock, MapPin, Users } from "lucide-react"

interface CalendarMonthViewProps {
  currentDate?: Date
  selectedDate?: Date
  events: CalendarEvent[]
  availability?: any[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onDateSelect?: (date: Date) => void
  onDateRightClick?: (date: Date) => void
  onCreateEventAtTime?: (date: Date) => void
}

export function CalendarMonthView({
  currentDate,
  selectedDate,
  events = [],
  availability = [],
  onEventClick,
  onDateClick,
  onDateSelect,
  onDateRightClick,
  onCreateEventAtTime,
}: CalendarMonthViewProps) {
  const baseDate = currentDate || selectedDate || new Date()
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = addDays(startOfWeek(endOfMonth(monthEnd)), 6)

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      try {
        const eventDate = parseISO(event.start)
        return isValid(eventDate) && isSameDay(eventDate, date)
      } catch (error) {
        return false
      }
    })
  }

  // Get availability for a specific date
  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return availability.find(a => {
      try {
        const availDate = parseISO(a.date)
        return isValid(availDate) && format(availDate, "yyyy-MM-dd") === dateStr
      } catch (error) {
        return false
      }
    })
  }

  // Format time from ISO string
  const formatEventTime = (isoString: string) => {
    try {
      const date = parseISO(isoString)
      return format(date, "h:mm a")
    } catch (error) {
      return ""
    }
  }

  const renderDayHeaders = () => {
    const days = []
    const startWeek = startOfWeek(new Date())

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="py-3 text-center text-sm font-medium text-muted-foreground border-b min-w-0 truncate">
          <span className="hidden sm:inline">{format(addDays(startWeek, i), "EEEE")}</span>
          <span className="sm:hidden">{format(addDays(startWeek, i), "EEE")}</span>
        </div>
      )
    }

    return <div className="grid grid-cols-7 gap-0 w-full">{days}</div>
  }

  const renderCalendarGrid = () => {
    const rows = []
    let day = startDate

    while (day <= endDate) {
      const week = []

      for (let i = 0; i < 7; i++) {
        const currentDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isCurrentDay = isToday(day)
        const dayEvents = getEventsForDate(day)
        const hasEvents = dayEvents.length > 0
        const dayAvailability = getAvailabilityForDate(day)
        const hasAvailability = dayAvailability !== undefined

        week.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b cursor-pointer hover:bg-muted/50 transition-colors min-w-0 overflow-hidden relative",
              !isCurrentMonth && "bg-muted/20 text-muted-foreground",
              isCurrentDay && "bg-primary/10",
              hasAvailability && dayAvailability.isAvailable && "bg-green-50 border-green-200",
              hasAvailability && !dayAvailability.isAvailable && "bg-red-50 border-red-200",
            )}
            onClick={() => {
              if (onDateClick) onDateClick(currentDay)
              if (onDateSelect) onDateSelect(currentDay)
            }}
            onContextMenu={(e) => {
              if (onDateRightClick) {
                e.preventDefault()
                onDateRightClick(currentDay)
              }
            }}
            onDoubleClick={() => onCreateEventAtTime && onCreateEventAtTime(currentDay)}
          >
            {/* Date number */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrentDay && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex items-center gap-1">
                {hasAvailability && (
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      dayAvailability.isAvailable ? "bg-green-500" : "bg-red-500"
                    )}
                    title={dayAvailability.isAvailable ? "Available" : "Unavailable"}
                  />
                )}
                {hasEvents && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {dayEvents.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="group relative"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                >
                  <div
                    className={cn(
                      "text-xs p-1.5 rounded-md cursor-pointer transition-all duration-200",
                      "hover:shadow-sm hover:scale-[1.02] hover:z-10",
                      "truncate max-w-full"
                    )}
                    style={{
                      backgroundColor: event.color || getUserCalendarColor(event.createdBy),
                      color: "white",
                    }}
                    title={`${event.title}${event.location ? ` - ${event.location}` : ""}`}
                  >
                    <div className="flex items-center space-x-1">
                      {!event.allDay && (
                        <Clock className="h-3 w-3 flex-shrink-0 opacity-80" />
                      )}
                      <span className="font-medium truncate">
                        {!event.allDay && formatEventTime(event.start)} {event.title}
                      </span>
                    </div>

                    {/* Additional event info on hover */}
                    <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-lg p-2 min-w-[200px] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="text-xs space-y-1">
                        <div className="font-medium text-foreground">{event.title}</div>
                        {!event.allDay && (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatEventTime(event.start)} - {formatEventTime(event.end)}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            {event.attendees.length} attendees
                          </div>
                        )}
                        {event.description && (
                          <div className="text-muted-foreground line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show more events indicator */}
              {dayEvents.length > 3 && (
                <div
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Show first additional event or a summary
                    if (dayEvents[3]) {
                      onEventClick(dayEvents[3])
                    }
                  }}
                >
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )

        day = addDays(day, 1)
      }

      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0 w-full">
          {week}
        </div>
      )
    }

    return <div className="flex-1 overflow-auto w-full">{rows}</div>
  }

  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      {renderDayHeaders()}
      {renderCalendarGrid()}
    </div>
  )
}
