"use client"

import { useMemo } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isValid,
  isToday,
  differenceInMinutes,
} from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"

interface CalendarWeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onCreateEventAtTime: (date: Date) => void
}

export function CalendarWeekView({ currentDate, events, onEventClick, onCreateEventAtTime }: CalendarWeekViewProps) {
  // Calculate days for the current week
  const weekDays = useMemo(() => {
    if (!isValid(currentDate)) return []
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Generate time slots for the day (1-hour intervals)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const date = new Date()
      date.setHours(i, 0, 0, 0)
      return date
    })
  }, [])

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    if (!isValid(day)) return []

    return events.filter((event) => {
      try {
        const eventDate = parseISO(event.start)
        return isValid(eventDate) && isSameDay(eventDate, day)
      } catch (error) {
        return false
      }
    })
  }

  // Calculate event position and height based on start and end times
  const getEventStyle = (event: CalendarEvent) => {
    try {
      const startDate = parseISO(event.start)
      const endDate = parseISO(event.end)

      if (!isValid(startDate) || !isValid(endDate)) {
        return { top: 0, height: 60 }
      }

      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
      const durationMinutes = differenceInMinutes(endDate, startDate)

      // Each hour is 60px tall
      const top = (startMinutes / 60) * 60
      const height = (durationMinutes / 60) * 60

      return {
        top: top,
        height: Math.max(height, 20), // Minimum height of 20px
      }
    } catch (error) {
      return { top: 0, height: 60 }
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-[60px_1fr] overflow-hidden h-full">
        {/* Time labels column */}
        <div className="overflow-y-scroll scrollbar-hide">
          <div className="h-12"></div> {/* Empty space for header */}
          {timeSlots.map((time) => (
            <div key={time.toString()} className="h-[60px] border-b pr-2 text-right text-sm text-muted-foreground">
              {format(time, "h a")}
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="overflow-y-scroll">
          {/* Day headers */}
          <div className="grid grid-cols-7 h-12 border-b sticky top-0 bg-background z-10">
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className={cn(
                  "text-center py-3 font-medium border-r",
                  isToday(day) ? "bg-blue-50 dark:bg-blue-900/20" : "",
                )}
              >
                <div>{format(day, "EEE")}</div>
                <div className={cn("text-sm", isToday(day) ? "text-primary font-bold" : "")}>{format(day, "d")}</div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            {/* Time slot grid */}
            <div className="grid grid-cols-7">
              {weekDays.map((day) => (
                <div key={day.toString()} className="border-r">
                  {timeSlots.map((time) => {
                    const slotDate = new Date(day)
                    slotDate.setHours(time.getHours(), 0, 0, 0)

                    return (
                      <div
                        key={`${day}-${time}`}
                        className="h-[60px] border-b hover:bg-muted/20 cursor-pointer"
                        onClick={() => onCreateEventAtTime(slotDate)}
                      ></div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Events */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day)

              return (
                <div key={day.toString()} className="absolute top-0 left-0 right-0 pointer-events-none">
                  {dayEvents.map((event) => {
                    const { top, height } = getEventStyle(event)

                    return (
                      <div
                        key={event.id}
                        className="absolute rounded px-2 py-1 text-xs overflow-hidden pointer-events-auto cursor-pointer"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `${(dayIndex / 7) * 100}%`,
                          width: `${100 / 7}%`,
                          backgroundColor: `${event.color}30`,
                          borderLeft: `3px solid ${event.color}`,
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(parseISO(event.start), "h:mm a")} - {format(parseISO(event.end), "h:mm a")}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
