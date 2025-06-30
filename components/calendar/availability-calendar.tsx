"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import type { Availability, UnavailableTimeSlot } from "@/lib/calendar-utils"
import { Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AvailabilityCalendarProps {
  month: Date
  availability: Availability | null
  selectedDays: Date[]
  onSelectDay: (day: Date) => void
}

export function AvailabilityCalendar({ month, availability, selectedDays, onSelectDay }: AvailabilityCalendarProps) {
  const [days, setDays] = useState<Date[]>([])
  const [weekdays] = useState(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])
  const [daySlots, setDaySlots] = useState<Record<string, UnavailableTimeSlot[]>>({})

  // Generate days for the month
  useEffect(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const daysInMonth = eachDayOfInterval({ start, end })
    setDays(daysInMonth)
  }, [month])

  // Group unavailable slots by day
  useEffect(() => {
    if (!availability) return

    const slots: Record<string, UnavailableTimeSlot[]> = {}

    availability.unavailableSlots.forEach((slot) => {
      if (!slots[slot.date]) {
        slots[slot.date] = []
      }
      slots[slot.date].push(slot)
    })

    setDaySlots(slots)
  }, [availability])

  // Check if a day is available
  const isDayAvailable = (day: Date): boolean => {
    if (!availability) return false

    const dateStr = format(day, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    // If no specific availability is set, default to available on weekdays
    if (!dateAvail) {
      const dayOfWeek = day.getDay()
      return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
    }

    return dateAvail.available
  }

  // Check if a day is selected
  const isDaySelected = (day: Date): boolean => {
    return selectedDays.some((d) => isSameDay(d, day))
  }

  // Get day class names based on availability and selection
  const getDayClassNames = (day: Date) => {
    const isAvailable = isDayAvailable(day)
    const isSelected = isDaySelected(day)
    const dateStr = format(day, "yyyy-MM-dd")
    const hasUnavailableSlots = daySlots[dateStr] && daySlots[dateStr].length > 0

    return cn(
      "flex flex-col items-center justify-start h-10 w-10 rounded-full text-sm font-medium relative",
      isToday(day) && "border border-gray-300",
      !isSameMonth(day, month) && "text-gray-400",
      isSameMonth(day, month) && !isAvailable && !isSelected && "bg-red-100 hover:bg-red-200 text-red-800",
      isSameMonth(day, month) &&
        isAvailable &&
        !hasUnavailableSlots &&
        !isSelected &&
        "bg-green-100 hover:bg-green-200 text-green-800",
      isSameMonth(day, month) &&
        isAvailable &&
        hasUnavailableSlots &&
        !isSelected &&
        "bg-amber-100 hover:bg-amber-200 text-amber-800",
      isSelected && "ring-2 ring-offset-2 ring-blue-500",
      isSelected && isAvailable && !hasUnavailableSlots && "bg-green-200",
      isSelected && isAvailable && hasUnavailableSlots && "bg-amber-200",
      isSelected && !isAvailable && "bg-red-200",
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Add empty cells for days before the start of the month */}
        {days.length > 0 &&
          Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-start-${i}`} className="h-10" />
          ))}

        {/* Render days of the month */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const dayUnavailableSlots = daySlots[dateStr] || []

          return (
            <TooltipProvider key={day.toString()} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => onSelectDay(day)} className={getDayClassNames(day)}>
                    <span>{format(day, "d")}</span>
                    {dayUnavailableSlots.length > 0 && (
                      <span className="absolute bottom-0 right-0">
                        <Clock className="h-3 w-3 text-amber-500" />
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                {dayUnavailableSlots.length > 0 && (
                  <TooltipContent side="bottom" className="p-2 max-w-[200px]">
                    <div className="text-xs font-medium mb-1">Unavailable times:</div>
                    <div className="space-y-1">
                      {dayUnavailableSlots.map((slot, i) => (
                        <div key={i} className="text-xs">
                          {slot.startTime} - {slot.endTime}
                          {slot.title && <span className="ml-1">({slot.title})</span>}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}
