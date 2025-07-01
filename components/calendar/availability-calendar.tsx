"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { toast } from "sonner"
import { CalendarMonthView } from "./calendar-month-view"

interface Viewer {
  id: string
  name: string
}

interface AvailabilityCalendarProps {
  userId: string
  isEditable?: boolean
  onAvailabilityChange?: (availability: any) => void
}

export function AvailabilityCalendar({
  userId,
  isEditable = false,
  onAvailabilityChange
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availability, setAvailability] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [selectedViewers, setSelectedViewers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [availabilityRes, eventsRes] = await Promise.all([
          api.get(`/users/${userId}/availability`),
          api.get(`/users/${userId}/events`)
        ])
        setAvailability(availabilityRes.data)
        setEvents(eventsRes.data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to fetch calendar data")
        setIsLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const handleDateSelect = async (date: Date) => {
    if (!isEditable) return

    try {
      const newAvailability = {
        date: format(date, "yyyy-MM-dd"),
        isAvailable: !availability.find(a =>
          format(parseISO(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        )?.isAvailable
      }

      await api.post(`/users/${userId}/availability`, newAvailability)

      setAvailability(prev => {
        const existing = prev.find(a =>
          format(parseISO(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        )
        if (existing) {
          return prev.map(a =>
            format(parseISO(a.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
              ? { ...a, isAvailable: !a.isAvailable }
              : a
          )
        }
        return [...prev, newAvailability]
      })

      if (onAvailabilityChange) {
        onAvailabilityChange(availability)
      }
    } catch (error) {
      toast.error("Failed to update availability")
    }
  }

  const handleViewerChange = async (viewerId: string) => {
    try {
      if (selectedViewers.includes(viewerId)) {
        setSelectedViewers(prev => prev.filter(id => id !== viewerId))
      } else {
        setSelectedViewers(prev => [...prev, viewerId])
        // Fetch viewer's events
        const viewerEvents = await api.get(`/users/${viewerId}/events`)
        setEvents(prev => [...prev, ...viewerEvents.data])
      }
    } catch (error) {
      toast.error("Failed to update viewer")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Availability Calendar</CardTitle>
            {isEditable && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Click on dates to toggle availability</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {viewers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Team Members</h3>
              <div className="flex flex-wrap gap-2">
                {viewers.map(viewer => (
                  <Button
                    key={viewer.id}
                    variant={selectedViewers.includes(viewer.id) ? "default" : "outline"}
                    onClick={() => handleViewerChange(viewer.id)}
                    className="text-sm"
                    size="sm"
                  >
                    {viewer.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-100" />
              <span className="text-sm">Events</span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <CalendarMonthView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              events={events}
              availability={availability}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
