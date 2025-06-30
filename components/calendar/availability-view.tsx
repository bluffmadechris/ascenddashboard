"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { loadUserAvailability, type DateAvailability } from "@/lib/calendar-utils"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvailabilityViewProps {
  userId?: string
  onDateSelect?: (date: Date, availability: DateAvailability | null) => void
}

export function AvailabilityView({ userId, onDateSelect }: AvailabilityViewProps) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateAvailability, setDateAvailability] = useState<DateAvailability[]>([])
  const [selectedDateAvailability, setSelectedDateAvailability] = useState<DateAvailability | null>(null)

  // Load user availability
  useEffect(() => {
    const targetUserId = userId || (user ? user.id : null)
    if (!targetUserId) return

    try {
      const availability = loadUserAvailability(targetUserId)
      if (availability) {
        setDateAvailability(availability.dates || [])

        // Check if selected date has availability info
        if (selectedDate) {
          const dateStr = format(selectedDate, "yyyy-MM-dd")
          const dateAvail = availability.dates.find((d) => d.date === dateStr)
          setSelectedDateAvailability(dateAvail || null)
        }
      }
    } catch (error) {
      console.error("Error loading availability:", error)
    }
  }, [userId, user, selectedDate])

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)

    // Find availability for this date
    const dateStr = format(date, "yyyy-MM-dd")
    const dateAvail = dateAvailability.find((d) => d.date === dateStr)
    setSelectedDateAvailability(dateAvail || null)

    if (onDateSelect) {
      onDateSelect(date, dateAvail || null)
    }
  }

  // Custom day render to show availability
  const renderDay = (day: Date) => {
    // Find availability for this day
    const dateStr = format(day, "yyyy-MM-dd")
    const dayAvail = dateAvailability.find((d) => d.date === dateStr)

    // Determine availability status
    let availabilityStatus = "unknown"
    if (dayAvail) {
      availabilityStatus = dayAvail.available ? "available" : "unavailable"
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center",
            availabilityStatus === "available" && "bg-green-100 dark:bg-green-900/20",
            availabilityStatus === "unavailable" && "bg-red-100 dark:bg-red-900/20",
          )}
        >
          {format(day, "d")}
        </div>
        {availabilityStatus !== "unknown" && (
          <div
            className={cn(
              "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-1 rounded-full",
              availabilityStatus === "available" ? "bg-green-500" : "bg-red-500",
            )}
          />
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
        <CardDescription>View and manage your availability for meetings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              components={{
                Day: ({ day, ...props }) => <button {...props}>{renderDay(day)}</button>,
              }}
            />
          </div>

          <div className="flex-1">
            {selectedDate && (
              <div className="space-y-4">
                <h3 className="font-medium text-lg">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>

                {selectedDateAvailability ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={selectedDateAvailability.available ? "success" : "destructive"}>
                        {selectedDateAvailability.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>

                    {selectedDateAvailability.available && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {selectedDateAvailability.startTime} - {selectedDateAvailability.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No availability information for this date.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
