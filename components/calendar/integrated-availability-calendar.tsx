"use client"

import { useState, useEffect, useMemo } from "react"
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isValid,
} from "date-fns"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  type CalendarEvent,
  type Availability,
  type DateAvailability,
  type RecurrenceRule,
  loadUserAvailability,
  saveUserAvailability,
  getDefaultAvailability,
  isDateAvailable,
  toggleDateAvailability,
} from "@/lib/calendar-utils"
import { AvailabilityIndicator } from "./availability-indicator"
import { AvailabilityDetailModal } from "./availability-detail-modal"
import { TimeSlotManager } from "./time-slot-manager"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface IntegratedAvailabilityCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onCreateEventAtTime?: (date: Date) => void
  onAvailabilityChange?: () => void
}

export function IntegratedAvailabilityCalendar({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onCreateEventAtTime,
  onAvailabilityChange,
}: IntegratedAvailabilityCalendarProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false)
  const [detailDate, setDetailDate] = useState<Date | null>(null)
  const [detailEndDate, setDetailEndDate] = useState<Date | null>(null)
  const [detailIsAvailable, setDetailIsAvailable] = useState(true)
  const [detailStartTime, setDetailStartTime] = useState("09:00")
  const [detailEndTime, setDetailEndTime] = useState("17:00")
  const [detailNote, setDetailNote] = useState("")
  const [detailRecurrence, setDetailRecurrence] = useState<RecurrenceRule | null>(null)

  // Load user availability
  useEffect(() => {
    if (!user) return

    // Load existing availability or initialize with defaults
    const existingAvailability = loadUserAvailability(user.id)
    if (!existingAvailability) {
      // Initialize with defaults only if no existing availability
      const userAvailability = getDefaultAvailability(user.id)
      saveUserAvailability(userAvailability)
      setAvailability(userAvailability)
    } else {
      setAvailability(existingAvailability)
    }
  }, [user])

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    if (!isValid(currentDate)) return []
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!isValid(date)) return []

    return events.filter((event) => {
      try {
        const eventDate = new Date(event.start)
        return isValid(eventDate) && isSameDay(eventDate, date)
      } catch {
        return false
      }
    })
  }

  // Format time from ISO string
  const formatTimeFromISO = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return format(date, "h:mm a")
    } catch {
      return ""
    }
  }

  // Check if a day is fixed unavailable (Thursday and Friday)
  const isFixedUnavailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay()
    return dayOfWeek === 4 || dayOfWeek === 5 // Thursday is 4, Friday is 5
  }

  // Check if a day is available
  const isDayAvailable = (date: Date): boolean => {
    if (!user) return false
    return isDateAvailable(user.id, date)
  }

  // Check if a day has unavailable time slots
  const hasUnavailableTimeSlots = (date: Date): boolean => {
    if (!availability) return false

    const dateStr = format(date, "yyyy-MM-dd")
    return availability.unavailableSlots.some((slot) => slot.date === dateStr)
  }

  // Get unavailable time slots for a date
  const getUnavailableSlotsForDate = (date: Date): UnavailableTimeSlot[] => {
    if (!availability) return []

    const dateStr = format(date, "yyyy-MM-dd")
    return availability.unavailableSlots.filter((slot) => slot.date === dateStr)
  }

  // Get availability details for a date
  const getAvailabilityDetailsForDate = (date: Date) => {
    if (!availability) {
      return {
        isAvailable: false,
        startTime: "09:00",
        endTime: "17:00",
      }
    }

    const dateStr = format(date, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    if (!dateAvail) {
      return {
        isAvailable: false,
        startTime: availability.defaultStartTime,
        endTime: availability.defaultEndTime,
      }
    }

    return {
      isAvailable: dateAvail.available,
      startTime: dateAvail.startTime,
      endTime: dateAvail.endTime,
    }
  }

  // Toggle day availability
  const toggleDayAvailability = (date: Date) => {
    if (!user) return

    try {
      const result = toggleDateAvailability(user.id, date)

      // Update local state
      const updatedAvailability = loadUserAvailability(user.id)
      setAvailability(updatedAvailability)
      onAvailabilityChange?.()

      // Show feedback toast
      toast({
        title: result.available ? "Marked as Available" : "Marked as Unavailable",
        description: format(date, "MMMM d, yyyy"),
      })
    } catch (error) {
      console.error("Error toggling availability:", error)
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      })
    }
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    // Toggle availability when clicking the day
    toggleDayAvailability(date)
    setSelectedDate(date)
    onDateClick?.(date)
  }

  // Get availability status class
  const getAvailabilityStatusClass = (date: Date): string => {
    const isAvailable = isDayAvailable(date)
    const hasUnavailable = hasUnavailableTimeSlots(date)
    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false

    return cn(
      "relative h-full min-h-[100px] p-2 hover:bg-accent/50 cursor-pointer",
      isToday(date) && "border-2 border-primary",
      !isSameMonth(date, currentDate) && "text-muted-foreground bg-muted/50",
      isSelected && "bg-accent",
      isAvailable ? "bg-green-100/50" : "bg-red-100/50",
      hasUnavailable && "ring-1 ring-yellow-500",
    )
  }

  // Open availability detail modal
  const openDetailModal = (date: Date) => {
    const details = getAvailabilityDetailsForDate(date)
    setDetailDate(date)
    setDetailIsAvailable(details.isAvailable)
    setDetailStartTime(details.startTime)
    setDetailEndTime(details.endTime)
    setShowDetailModal(true)
  }

  // Save availability details
  const saveAvailabilityDetails = (data: {
    isAvailable: boolean
    startTime: string
    endTime: string
    note?: string
    recurrence?: RecurrenceRule | null
  }) => {
    if (!user || !availability || !detailDate) return

    try {
      const dateStr = format(detailDate, "yyyy-MM-dd")
      const updatedDates = [...availability.dates]
      const existingIndex = updatedDates.findIndex((d) => d.date === dateStr)

      const newDateAvailability: DateAvailability = {
        date: dateStr,
        available: data.isAvailable,
        startTime: data.startTime,
        endTime: data.endTime,
      }

      if (existingIndex !== -1) {
        updatedDates[existingIndex] = newDateAvailability
      } else {
        updatedDates.push(newDateAvailability)
      }

      const updatedAvailability = {
        ...availability,
        dates: updatedDates,
      }

      saveUserAvailability(updatedAvailability)
      setAvailability(updatedAvailability)
      setShowDetailModal(false)
      onAvailabilityChange?.()
    } catch (error) {
      console.error("Error saving availability details:", error)
      toast({
        title: "Error",
        description: "Failed to save availability details",
        variant: "destructive",
      })
    }
  }

  // Handle double click
  const handleDoubleClick = (date: Date) => {
    // Don't allow detail view for fixed unavailable days
    if (isFixedUnavailable(date)) return

    openDetailModal(date)
  }

  // Handle time slot manager close
  const handleTimeSlotManagerClose = (value: boolean) => {
    if (!value) {
      setShowTimeSlotManager(false)
    }
  }

  // Toggle range selection mode
  const toggleRangeSelectionMode = () => {
    setRangeSelectionMode(!rangeSelectionMode)
    setRangeStartDate(null)
    setRangeEndDate(null)

    toast({
      title: rangeSelectionMode ? "Range selection disabled" : "Range selection enabled",
      description: rangeSelectionMode
        ? "Click on individual dates to select them"
        : "Click on a start date, then an end date to select a range",
    })
  }

  // Update availability for a date range
  const updateDateRangeAvailability = (
    startDate: Date,
    endDate: Date,
    isAvailable: boolean,
    startTime: string,
    endTime: string,
    note?: string,
    recurrence?: RecurrenceRule,
  ) => {
    if (!user || !availability) return

    try {
      // Ensure start date is before end date
      const start = isBefore(startDate, endDate) ? startDate : endDate
      const end = isAfter(endDate, startDate) ? endDate : startDate

      // Get all dates in the range
      const datesInRange = eachDay({ start, end })

      // Update availability for each date
      const updatedDates = [...availability.dates]
      const updatedSlots = [...availability.unavailableSlots]

      datesInRange.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const existingIndex = updatedDates.findIndex((d) => d.date === dateStr)

        // Update or add date availability
        if (existingIndex !== -1) {
          updatedDates[existingIndex] = {
            ...updatedDates[existingIndex],
            available: isAvailable,
            startTime,
            endTime,
          }
        } else {
          updatedDates.push({
            date: dateStr,
            available: isAvailable,
            startTime,
            endTime,
          })
        }

        // Remove existing slots for this date
        const filteredSlots = updatedSlots.filter((slot) => slot.date !== dateStr)
        updatedSlots.length = 0
        updatedSlots.push(...filteredSlots)

        // Add new slot if there's a note
        if (note) {
          updatedSlots.push({
            id: `${dateStr}-${Date.now()}`,
            date: dateStr,
            startTime,
            endTime,
            title: note,
            recurring: recurrence,
          })
        }
      })

      // Save updated availability
      const updatedAvailability: Availability = {
        ...availability,
        dates: updatedDates,
        unavailableSlots: updatedSlots,
      }

      saveUserAvailability(updatedAvailability)
      setAvailability(updatedAvailability)
      setRefreshKey((prev) => prev + 1)

      if (onAvailabilityChange) {
        onAvailabilityChange()
      }

      toast({
        title: "Date range updated",
        description: `Updated availability for ${format(start, "MMM d")} to ${format(end, "MMM d, yyyy")}`,
      })

      // Reset range selection
      setRangeSelectionMode(false)
      setRangeStartDate(null)
      setRangeEndDate(null)
    } catch (error) {
      console.error("Error updating date range:", error)
      toast({
        title: "Error",
        description: "Failed to update availability for date range",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border border-border bg-card rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="col-span-7 grid grid-cols-7 bg-muted/50 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center p-3 text-sm font-medium text-muted-foreground border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date)
          const isAvail = isDayAvailable(date)
          const hasUnavailable = hasUnavailableTimeSlots(date)
          const availDetails = getAvailabilityDetailsForDate(date)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
          const isCurrentMonth = isSameMonth(date, currentDate)

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "min-h-[140px] relative group transition-all duration-200",
                "border-r border-b border-border last:border-r-0",
                "hover:bg-accent/50",
                isSelected && "ring-1 ring-primary ring-inset",
                !isCurrentMonth && "opacity-50",
                isToday(date) && "bg-accent/30",
                "cursor-pointer"
              )}
              onClick={() => handleDateClick(date)}
              onDoubleClick={() => handleDoubleClick(date)}
            >
              {/* Date number and availability status */}
              <div className="p-2 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(date) && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
                  )}>
                    {format(date, "d")}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasUnavailable && (
                      <Badge variant="outline" className="h-5 px-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      </Badge>
                    )}
                    <AvailabilityIndicator
                      available={isAvail}
                      onClick={() => toggleDayAvailability(date)}
                      className="opacity-100"
                    />
                  </div>
                </div>

                {/* Events list */}
                <div className="mt-1">
                  {dayEvents.map((event, eventIndex) => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "text-xs px-2 py-1 rounded-md truncate cursor-pointer",
                              "bg-primary/10 hover:bg-primary/20 transition-colors",
                              "border border-border"
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick?.(event)
                            }}
                          >
                            {event.title}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="center"
                          className="bg-card/95 backdrop-blur-sm border-border/50"
                        >
                          <div className="text-sm">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-muted-foreground">
                              {formatTimeFromISO(event.start)} - {formatTimeFromISO(event.end)}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Time Slot Manager Dialog */}
      <Dialog open={showTimeSlotManager} onOpenChange={handleTimeSlotManagerClose}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedDate && (
            <TimeSlotManager
              date={selectedDate}
              availability={availability}
              onSave={(slots) => {
                if (availability) {
                  const updatedAvailability = {
                    ...availability,
                    unavailableSlots: [
                      ...availability.unavailableSlots.filter(
                        (slot) => slot.date !== format(selectedDate, "yyyy-MM-dd")
                      ),
                      ...slots,
                    ],
                  }
                  saveUserAvailability(updatedAvailability)
                  setAvailability(updatedAvailability)
                  setShowTimeSlotManager(false)
                  onAvailabilityChange?.()
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Availability Detail Modal */}
      <AvailabilityDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        date={detailDate}
        endDate={detailEndDate}
        isAvailable={detailIsAvailable}
        startTime={detailStartTime}
        endTime={detailEndTime}
        note={detailNote}
        recurrence={detailRecurrence}
        onSave={saveAvailabilityDetails}
      />
    </div>
  )
}
