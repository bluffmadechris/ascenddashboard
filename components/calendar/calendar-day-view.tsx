"use client"

import { useMemo } from "react"
import { format, parseISO, isValid, differenceInMinutes, addMinutes, startOfDay, endOfDay } from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"

interface CalendarDayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onCreateEventAtTime: (date: Date) => void
}

export function CalendarDayView({ currentDate, events, onEventClick, onCreateEventAtTime }: CalendarDayViewProps) {
  // Generate time slots for the day (30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = []
    const day = new Date(currentDate)
    day.setHours(0, 0, 0, 0)

    for (let i = 0; i < 48; i++) {
      slots.push(addMinutes(day, i * 30))
    }

    return slots
  }, [currentDate])

  // Get events for the current day
  const dayEvents = useMemo(() => {
    if (!isValid(currentDate)) return []

    const start = startOfDay(currentDate)
    const end = endOfDay(currentDate)

    return events.filter((event) => {
      try {
        const eventStart = parseISO(event.start)
        return isValid(eventStart) && eventStart >= start && eventStart <= end
      } catch (error) {
        return false
      }
    })
  }, [currentDate, events])

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

      // Each hour is 60px tall, each 30 min slot is 30px
      const top = (startMinutes / 30) * 30
      const height = (durationMinutes / 30) * 30

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
          {timeSlots
            .filter((_, i) => i % 2 === 0)
            .map((time) => (
              <div key={time.toString()} className="h-[60px] border-b pr-2 text-right text-sm text-muted-foreground">
                {format(time, "h a")}
              </div>
            ))}
        </div>

        {/* Day column */}
        <div className="overflow-y-scroll relative">
          {/* Time slot grid */}
          <div>
            {timeSlots.map((time, i) => (
              <div
                key={time.toString()}
                className={cn(
                  "h-[30px] border-b hover:bg-muted/20 cursor-pointer",
                  i % 2 === 0 ? "border-b-0" : "border-b border-dashed",
                )}
                onClick={() => onCreateEventAtTime(time)}
              ></div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute left-0 right-0 border-t border-red-500 z-10"
            style={{
              top: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 30) * 30}px`,
            }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 -mt-1 -ml-1"></div>
          </div>

          {/* Events */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none">
            {dayEvents.map((event) => {
              const { top, height } = getEventStyle(event)

              return (
                <div
                  key={event.id}
                  className="absolute rounded px-2 py-1 text-xs overflow-hidden pointer-events-auto cursor-pointer"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `0`,
                    right: `0`,
                    backgroundColor: `${event.color}30`,
                    borderLeft: `3px solid ${event.color}`,
                  }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(parseISO(event.start), "h:mm a")} - {format(parseISO(event.end), "h:mm a")}
                  </div>
                  {event.location && <div className="text-[10px] text-muted-foreground truncate">{event.location}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
