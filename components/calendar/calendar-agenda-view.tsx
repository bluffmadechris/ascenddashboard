"use client"

import { useMemo } from "react"
import { format, parseISO, isValid, isSameDay, addDays, startOfDay, endOfDay, isAfter } from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"

interface CalendarAgendaViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarAgendaView({ currentDate, events, onEventClick }: CalendarAgendaViewProps) {
  // Get upcoming events for the next 30 days
  const upcomingEvents = useMemo(() => {
    if (!isValid(currentDate)) return []

    const start = startOfDay(currentDate)
    const end = endOfDay(addDays(currentDate, 30))

    return events
      .filter((event) => {
        try {
          const eventStart = parseISO(event.start)
          return isValid(eventStart) && isAfter(eventStart, start) && eventStart <= end
        } catch (error) {
          return false
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.start).getTime() - new Date(b.start).getTime()
        } catch (error) {
          return 0
        }
      })
  }, [currentDate, events])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}

    upcomingEvents.forEach((event) => {
      try {
        const eventDate = parseISO(event.start)
        if (!isValid(eventDate)) return

        const dateKey = format(eventDate, "yyyy-MM-dd")

        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }

        grouped[dateKey].push(event)
      } catch (error) {
        console.error("Error grouping events:", error)
      }
    })

    return grouped
  }, [upcomingEvents])

  return (
    <div className="h-full overflow-y-auto p-4">
      {Object.keys(eventsByDate).length > 0 ? (
        Object.keys(eventsByDate).map((dateKey) => {
          try {
            const date = parseISO(dateKey)
            const isToday = isSameDay(date, new Date())

            return (
              <div key={dateKey} className="mb-6">
                <h3 className={cn("text-lg font-semibold mb-2", isToday ? "text-primary" : "")}>
                  {format(date, "EEEE, MMMM d, yyyy")}
                  {isToday && " (Today)"}
                </h3>
                <div className="space-y-2">
                  {eventsByDate[dateKey].map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-md border hover:bg-muted/20 cursor-pointer transition-colors"
                      style={{ borderLeft: `4px solid ${event.color}` }}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(event.start), "h:mm a")} - {format(parseISO(event.end), "h:mm a")}
                      </div>
                      {event.location && <div className="text-sm text-muted-foreground mt-1">{event.location}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          } catch (error) {
            return null
          }
        })
      ) : (
        <div className="text-center py-10 text-muted-foreground">No upcoming events in the next 30 days</div>
      )}
    </div>
  )
}
