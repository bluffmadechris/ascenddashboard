"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import type { Availability } from "@/lib/calendar-utils"

interface AvailabilityCalendarProps {
  month: Date
  availability: Availability | null
  selectedDays: Date[]
  onSelectDay: (day: Date) => void
}

export function AvailabilityCalendar({ month, availability, selectedDays, onSelectDay }: AvailabilityCalendarProps) {
  const [days, setDays] = useState<Date[]>([])
  const [weekdays] = useState(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])

  // Generate days for the month
  useEffect(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const daysInMonth = eachDayOfInterval({ start, end })
    setDays(daysInMonth)
  }, [month])

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

    return cn(
      "flex items-center justify-center h-10 w-10 rounded-full text-sm font-medium",
      isToday(day) && "border border-gray-300",
      !isSameMonth(day, month) && "text-gray-400",
      isSameMonth(day, month) && !isAvailable && !isSelected && "bg-red-100 hover:bg-red-200 text-red-800",
      isSameMonth(day, month) && isAvailable && !isSelected && "bg-green-100 hover:bg-green-200 text-green-800",
      isSelected && "ring-2 ring-offset-2 ring-blue-500",
      isSelected && isAvailable && "bg-green-200",
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
        {days.map((day) => (
          <button
            key={day.toString()}
            type="button"
            onClick={() => onSelectDay(day)}
            className={getDayClassNames(day)}
          >
            {format(day, "d")}
          </button>
        ))}
      </div>
    </div>
  )
}
