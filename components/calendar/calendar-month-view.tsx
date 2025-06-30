"use client"

import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  isValid,
} from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onCreateEventAtTime: (date: Date) => void
}

export function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onCreateEventAtTime,
}: CalendarMonthViewProps) {
  // Calculate days for the current month view
  const calendarDays = useMemo(() => {
    if (!isValid(currentDate)) {
      return eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
    }
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!isValid(date)) return []

    return events.filter((event) => {
      try {
        const eventDate = parseISO(event.start)
        return isValid(eventDate) && isSameDay(eventDate, date)
      } catch (error) {
        return false
      }
    })
  }

  // Format time from ISO string
  const formatTimeFromISO = (isoString: string) => {
    try {
      const date = parseISO(isoString)
      if (!isValid(date)) return "Invalid time"

      return format(date, "h:mm a")
    } catch (error) {
      return "Invalid time"
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header - Days of Week */}
      <div className="grid grid-cols-7 bg-muted/20">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 overflow-hidden">
        {/* Fill in days before the first of the month */}
        {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, index) => (
          <div key={`empty-start-${index}`} className="border-b border-r p-2 bg-muted/10"></div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day) => {
          if (!isValid(day)) return null

          const dayEvents = getEventsForDate(day)
          const isCurrentDay = isToday(day)
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <div
              key={day.toString()}
              className={cn(
                "border-b border-r p-2 transition-colors overflow-hidden",
                isCurrentDay ? "bg-blue-50 dark:bg-blue-900/20" : "",
                !isCurrentMonth ? "bg-muted/10 text-muted-foreground" : "",
                "hover:bg-muted/20 cursor-pointer",
              )}
              onClick={() => onDateClick(day)}
              onDoubleClick={() => onCreateEventAtTime(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isCurrentDay ? "bg-primary text-primary-foreground" : "",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Events for this day */}
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:bg-primary/10"
                    style={{ backgroundColor: `${event.color}30` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      ></div>
                      <span className="truncate">{event.title}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{formatTimeFromISO(event.start)}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Fill in days after the last day of the month */}
        {Array.from({ length: 6 - (calendarDays[calendarDays.length - 1]?.getDay() || 0) }).map((_, index) => (
          <div key={`empty-end-${index}`} className="border-b border-r p-2 bg-muted/10"></div>
        ))}
      </div>
    </div>
  )
}
