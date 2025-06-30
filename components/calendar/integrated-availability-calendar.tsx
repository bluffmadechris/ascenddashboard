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
          available: true, // Default to available when adding new dates
          startTime: availability.defaultStartTime,
          endTime: availability.defaultEndTime,
        })
      }

      // Save updated availability
      const updatedAvailability: Availability = {
        ...availability,
        dates: updatedDates,
      }

      saveUserAvailability(updatedAvailability)
      setAvailability(updatedAvailability)
      setRefreshKey((prev) => prev + 1)

      if (onAvailabilityChange) {
        onAvailabilityChange()
      }

      toast({
        title: "Availability updated",
        description: `${format(date, "MMMM d, yyyy")} is now ${isDayAvailable(date) ? "unavailable" : "available"}`,
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

  // Handle date click for range selection or regular click
  const handleDateClick = (date: Date) => {
    if (rangeSelectionMode) {
      // If we're in range selection mode
      if (!rangeStartDate) {
        // First click - set start date
        setRangeStartDate(date)
        toast({
          title: "Start date selected",
          description: `Selected ${format(date, "MMMM d, yyyy")} as start date. Now select an end date.`,
        })
      } else {
        // Second click - set end date and open detail modal
        setRangeEndDate(date)
        openDetailModal(rangeStartDate, date)
      }
    } else {
      // Regular date click behavior
      if (onDateClick) {
        onDateClick(date)
      }
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

  // Get availability status class
  const getAvailabilityStatusClass = (date: Date): string => {
    // If date is in selected range, highlight it
    if (isInSelectedRange(date)) {
      return "bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30"
    }

    // If date is the range start, highlight it differently
    if (rangeStartDate && isSameDay(date, rangeStartDate)) {
      return "bg-blue-200 dark:bg-blue-900/30 hover:bg-blue-300 dark:hover:bg-blue-900/40"
    }

    // Regular availability status
    if (!isDayAvailable(date)) {
      return "bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30"
    }

    if (hasUnavailableTimeSlots(date)) {
      return "bg-amber-100 dark:bg-amber-900/20 hover:bg-amber-200 dark:hover:bg-amber-900/30"
    }

    return "bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30"
  }

  return (
    <div className="h-full flex flex-col">
      {/* Range Selection Toggle */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Date Range Selection:</span>
          <button
            onClick={toggleRangeSelectionMode}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full transition-colors",
              rangeSelectionMode
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
            )}
          >
            {rangeSelectionMode ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Range Selection Instructions */}
      {rangeSelectionMode && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md p-2 mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {!rangeStartDate
              ? "Click on a date to select the start date of your range"
              : "Now click on another date to select the end date of your range"}
          </p>
        </div>
      )}

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
          const isAvailable = isDayAvailable(day)
          const hasTimeSlots = hasUnavailableTimeSlots(day)
          const unavailableSlots = getUnavailableSlotsForDate(day)
          const isInRange = isInSelectedRange(day)
          const isRangeStart = rangeStartDate && isSameDay(day, rangeStartDate)

          return (
            <div
              key={day.toString()}
              className={cn(
                "border-b border-r p-2 transition-colors overflow-hidden",
                isCurrentDay ? "bg-blue-50 dark:bg-blue-900/20" : "",
                !isCurrentMonth ? "bg-muted/10 text-muted-foreground" : "",
                isCurrentMonth ? getAvailabilityStatusClass(day) : "",
                "hover:bg-muted/20 cursor-pointer",
                isInRange ? "ring-2 ring-inset ring-blue-500" : "",
                isRangeStart ? "ring-2 ring-blue-600 ring-offset-2" : "",
              )}
              onClick={() => handleDateClick(day)}
              onDoubleClick={() => handleDoubleClick(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isCurrentDay ? "bg-primary text-primary-foreground" : "",
                    isRangeStart ? "bg-blue-500 text-white" : "",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex space-x-1">
                  {hasTimeSlots && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="h-5 px-1">
                            <Clock className="h-3 w-3 text-amber-500" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1 max-w-xs">
                            <p className="font-medium">Unavailable Time Slots:</p>
                            {unavailableSlots.map((slot) => (
                              <div key={slot.id} className="text-xs">
                                {slot.startTime} - {slot.endTime}
                                {slot.title && <span className="ml-1">({slot.title})</span>}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Enhanced Availability Indicator */}
                  {!rangeSelectionMode && (
                    <AvailabilityIndicator
                      isAvailable={isAvailable}
                      onToggle={() => toggleDayAvailability(day)}
                      onDetailView={() => openDetailModal(day)}
                      size="sm"
                    />
                  )}
                </div>
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
                      if (onEventClick) onEventClick(event)
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

      {/* Time Slot Manager Dialog */}
      <Dialog open={showTimeSlotManager} onOpenChange={setShowTimeSlotManager}>
        <DialogContent className="max-w-4xl">
          <TimeSlotManager date={selectedDate || undefined} onClose={handleTimeSlotManagerClose} />
        </DialogContent>
      </Dialog>

      {/* Availability Detail Modal */}
      <AvailabilityDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        date={detailDate}
        endDate={detailEndDate || undefined}
        isAvailable={detailIsAvailable}
        defaultStartTime={detailStartTime}
        defaultEndTime={detailEndTime}
        note={detailNote}
        recurrence={detailRecurrence}
        onSave={saveAvailabilityDetails}
      />
    </div>
  )
}
