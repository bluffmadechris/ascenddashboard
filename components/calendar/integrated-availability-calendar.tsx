"use client"

import { useState, useEffect, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isValid,
  isToday,
  isSameMonth,
  isWithinInterval,
  isBefore,
  isAfter,
  eachDayOfInterval as eachDay,
} from "date-fns"
import { Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import {
  type CalendarEvent,
  type Availability,
  type UnavailableTimeSlot,
  type RecurrenceRule,
  loadUserAvailability,
  saveUserAvailability,
} from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TimeSlotManager } from "@/components/calendar/time-slot-manager"
import { AvailabilityIndicator } from "@/components/calendar/availability-indicator"
import { AvailabilityDetailModal } from "@/components/calendar/availability-detail-modal"

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
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // New state for date range selection
  const [rangeSelectionMode, setRangeSelectionMode] = useState(false)
  const [rangeStartDate, setRangeStartDate] = useState<Date | null>(null)
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>(null)

  // New state for availability detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailDate, setDetailDate] = useState<Date>(new Date())
  const [detailEndDate, setDetailEndDate] = useState<Date | null>(null)
  const [detailIsAvailable, setDetailIsAvailable] = useState(true)
  const [detailStartTime, setDetailStartTime] = useState("09:00")
  const [detailEndTime, setDetailEndTime] = useState("17:00")
  const [detailNote, setDetailNote] = useState("")
  const [detailRecurrence, setDetailRecurrence] = useState<RecurrenceRule | undefined>(undefined)

  // Calculate days for the current month view
  const calendarDays = useMemo(() => {
    if (!isValid(currentDate)) {
      return eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
    }
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Load user availability
  useEffect(() => {
    if (!user) return

    try {
      const userAvailability = loadUserAvailability(user.id)
      if (userAvailability) {
        setAvailability(userAvailability)
      } else {
        // Create default availability
        const defaultAvailability: Availability = {
          userId: user.id,
          dates: [],
          defaultStartTime: "09:00",
          defaultEndTime: "17:00",
          unavailableSlots: [],
        }
        setAvailability(defaultAvailability)
        saveUserAvailability(defaultAvailability)
      }
    } catch (error) {
      console.error("Error loading availability:", error)
    }
  }, [user, refreshKey])

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
      console.error("Error formatting time:", error)
      return "Invalid time"
    }
  }

  // Check if a day is available
  const isDayAvailable = (date: Date): boolean => {
    if (!availability) return false

    const dateStr = format(date, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    // If no specific availability is set, default to available on weekdays
    if (!dateAvail) {
      const dayOfWeek = date.getDay()
      return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
    }

    return dateAvail.available
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
  const getAvailabilityDetailsForDate = (
    date: Date,
  ): {
    isAvailable: boolean
    startTime: string
    endTime: string
    note?: string
    recurrence?: RecurrenceRule
  } => {
    if (!availability) {
      return {
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00",
      }
    }

    const dateStr = format(date, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    // If no specific availability is set, use defaults
    if (!dateAvail) {
      const dayOfWeek = date.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

      return {
        isAvailable: isWeekday,
        startTime: availability.defaultStartTime,
        endTime: availability.defaultEndTime,
      }
    }

    // Get any notes from unavailable slots
    const slots = getUnavailableSlotsForDate(date)
    const note = slots.length > 0 ? slots[0].title : undefined
    const recurrence = slots.length > 0 ? slots[0].recurring : undefined

    return {
      isAvailable: dateAvail.available,
      startTime: dateAvail.startTime,
      endTime: dateAvail.endTime,
      note,
      recurrence,
    }
  }

  // Check if a date is in the selected range
  const isInSelectedRange = (date: Date): boolean => {
    if (!rangeStartDate || !rangeEndDate) return false

    // Ensure start date is before end date
    const start = isBefore(rangeStartDate, rangeEndDate) ? rangeStartDate : rangeEndDate
    const end = isAfter(rangeEndDate, rangeStartDate) ? rangeEndDate : rangeStartDate

    return isWithinInterval(date, { start, end })
  }

  // Toggle day availability
  const toggleDayAvailability = (date: Date) => {
    if (!user || !availability) return

    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const updatedDates = [...availability.dates]
      const existingIndex = updatedDates.findIndex((d) => d.date === dateStr)

      if (existingIndex !== -1) {
        // Toggle availability
        updatedDates[existingIndex] = {
          ...updatedDates[existingIndex],
          available: !updatedDates[existingIndex].available,
        }
      } else {
        // Create new entry with default times
        updatedDates.push({
          date: dateStr,
          available: false, // Default to unavailable when clicking for the first time
          startTime: availability.defaultStartTime,
          endTime: availability.defaultEndTime,
        })
      }

      // Sort dates chronologically
      updatedDates.sort((a, b) => a.date.localeCompare(b.date))

      // Update availability
      const updatedAvailability = {
        ...availability,
        dates: updatedDates,
      }

      // Save to storage
      saveUserAvailability(updatedAvailability)
      setAvailability(updatedAvailability)

      // Notify parent of change
      if (onAvailabilityChange) {
        onAvailabilityChange()
      }

      // Show toast
      toast({
        title: "Availability updated",
        description: `${format(date, "MMMM d, yyyy")} marked as ${isDayAvailable(date) ? "unavailable" : "available"}`,
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
  }

  // Get availability status class
  const getAvailabilityStatusClass = (date: Date): string => {
    const isAvailable = isDayAvailable(date)
    const hasUnavailable = hasUnavailableTimeSlots(date)
    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
    const isInRange = isInSelectedRange(date)

    return cn(
      "relative h-full min-h-[100px] p-2 hover:bg-accent/50 cursor-pointer",
      isToday(date) && "border-2 border-primary",
      !isSameMonth(date, currentDate) && "text-muted-foreground bg-muted/50",
      isSelected && "bg-accent",
      isInRange && "bg-accent/50",
      isAvailable ? "bg-green-100/50" : "bg-red-100/50",
      hasUnavailable && "ring-1 ring-yellow-500",
    )
  }

  // Open availability detail modal
  const openDetailModal = (date: Date, endDate?: Date) => {
    const details = getAvailabilityDetailsForDate(date)

    setDetailDate(date)
    setDetailEndDate(endDate || null)
    setDetailIsAvailable(details.isAvailable)
    setDetailStartTime(details.startTime)
    setDetailEndTime(details.endTime)
    setDetailNote(details.note || "")
    setDetailRecurrence(details.recurrence)

    setShowDetailModal(true)
  }

  // Save availability details
  const saveAvailabilityDetails = (data: {
    isAvailable: boolean
    startDate: Date
    endDate: Date
    startTime: string
    endTime: string
    note: string
    recurrence?: RecurrenceRule
  }) => {
    // If this is a date range (start date != end date)
    if (!isSameDay(data.startDate, data.endDate)) {
      updateDateRangeAvailability(
        data.startDate,
        data.endDate,
        data.isAvailable,
        data.startTime,
        data.endTime,
        data.note,
        data.recurrence,
      )
      return
    }

    // Otherwise, handle as a single date
    if (!user || !availability) return

    try {
      const dateStr = format(data.startDate, "yyyy-MM-dd")
      const updatedDates = [...availability.dates]
      const existingIndex = updatedDates.findIndex((d) => d.date === dateStr)

      // Update or add date availability
      if (existingIndex !== -1) {
        updatedDates[existingIndex] = {
          ...updatedDates[existingIndex],
          available: data.isAvailable,
          startTime: data.startTime,
          endTime: data.endTime,
        }
      } else {
        updatedDates.push({
          date: dateStr,
          available: data.isAvailable,
          startTime: data.startTime,
          endTime: data.endTime,
        })
      }

      // Handle note and recurrence by updating unavailable slots
      let updatedSlots = [...availability.unavailableSlots]

      // Remove existing slots for this date
      updatedSlots = updatedSlots.filter((slot) => slot.date !== dateStr)

      // Add new slot if there's a note or recurrence
      if (data.note || data.recurrence) {
        updatedSlots.push({
          id: `${dateStr}-${Date.now()}`,
          date: dateStr,
          startTime: data.startTime,
          endTime: data.endTime,
          title: data.note,
          recurring: data.recurrence,
        })
      }

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
        title: "Availability details saved",
        description: `Updated availability for ${format(data.startDate, "MMMM d, yyyy")}`,
      })
    } catch (error) {
      console.error("Error saving availability details:", error)
      toast({
        title: "Error",
        description: "Failed to save availability details",
        variant: "destructive",
      })
    }
  }

  // Handle double click to open time slot manager
  const handleDoubleClick = (date: Date) => {
    setSelectedDate(date)
    setShowTimeSlotManager(true)
  }

  // Handle time slot manager close
  const handleTimeSlotManagerClose = () => {
    setShowTimeSlotManager(false)
    setRefreshKey((prev) => prev + 1)
    if (onAvailabilityChange) {
      onAvailabilityChange()
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
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-7 gap-px bg-muted p-px">
        {/* Weekday headers */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="bg-card px-2 py-3 text-center text-sm font-medium">
            {day}
          </div>
        ))}

        {/* Calendar grid */}
        {calendarDays.map((date, dayIdx) => {
          const dayEvents = getEventsForDate(date)
          const dayAvailability = getAvailabilityDetailsForDate(date)

          return (
            <div
              key={date.toString()}
              className={getAvailabilityStatusClass(date)}
              onClick={() => handleDateClick(date)}
            >
              <div className="flex justify-between">
                <span className="text-sm">{format(date, "d")}</span>
                {dayEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {dayEvents.length}
                  </Badge>
                )}
              </div>

              {/* Events */}
              <div className="mt-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <TooltipProvider key={event.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="mb-1 truncate rounded-sm bg-primary/10 px-1 py-0.5 text-xs"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent triggering the day click
                            if (onEventClick) onEventClick(event)
                          }}
                        >
                          {event.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs">
                          {formatTimeFromISO(event.start)} - {formatTimeFromISO(event.end)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                )}
              </div>

              {/* Availability indicator */}
              <div className="absolute bottom-1 right-1">
                <AvailabilityIndicator
                  isAvailable={dayAvailability.isAvailable}
                  hasUnavailableSlots={hasUnavailableTimeSlots(date)}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent triggering the day click
                    openDetailModal(date)
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Time slot manager dialog */}
      <Dialog open={showTimeSlotManager} onOpenChange={setShowTimeSlotManager}>
        <DialogContent className="max-w-lg">
          {selectedDate && (
            <TimeSlotManager
              date={selectedDate}
              availability={availability}
              onSave={(slots) => {
                if (!availability) return

                const updatedAvailability = {
                  ...availability,
                  unavailableSlots: [
                    ...availability.unavailableSlots.filter(
                      (slot) => slot.date !== format(selectedDate, "yyyy-MM-dd"),
                    ),
                    ...slots,
                  ],
                }

                saveUserAvailability(updatedAvailability)
                setAvailability(updatedAvailability)
                setShowTimeSlotManager(false)

                if (onAvailabilityChange) {
                  onAvailabilityChange()
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Availability detail modal */}
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
