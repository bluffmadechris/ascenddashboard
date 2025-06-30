"use client"

import { useState, useEffect } from "react"
import { AvailabilityToggleButton } from "./availability-toggle-button"

interface AvailabilityToggleCalendarProps {
  month?: number // 0-11
  year?: number
  onAvailabilityChange?: (date: Date, availability: "available" | "unavailable") => void
}

export function AvailabilityToggleCalendar({
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  onAvailabilityChange,
}: AvailabilityToggleCalendarProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

  // Generate calendar days for the specified month
  useEffect(() => {
    const days: Date[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get the first Monday before or on the first day of the month
    const firstMonday = new Date(firstDay)
    const dayOfWeek = firstDay.getDay() || 7 // Convert Sunday (0) to 7
    firstMonday.setDate(firstDay.getDate() - dayOfWeek + 1) // +1 because we want Monday

    // Get the last Sunday after or on the last day of the month
    const lastSunday = new Date(lastDay)
    const lastDayOfWeek = lastDay.getDay() || 7
    if (lastDayOfWeek < 7) {
      lastSunday.setDate(lastDay.getDate() + (7 - lastDayOfWeek))
    }

    // Generate all days from first Monday to last Sunday
    const currentDay = new Date(firstMonday)
    while (currentDay <= lastSunday) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    setCalendarDays(days)
  }, [month, year])

  // Handle availability change
  const handleAvailabilityChange = (date: Date | string, availability: "available" | "unavailable") => {
    if (onAvailabilityChange && date instanceof Date) {
      onAvailabilityChange(date, availability)
    }
  }

  // Determine initial availability (weekends unavailable by default)
  const getInitialAvailability = (date: Date): "available" | "unavailable" => {
    const day = date.getDay()
    return day === 0 || day === 6 ? "unavailable" : "available" // 0 = Sunday, 6 = Saturday
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const isCurrentMonth = day.getMonth() === month

          return (
            <div key={day.toISOString()} className={`text-center ${!isCurrentMonth ? "opacity-50" : ""}`}>
              <AvailabilityToggleButton
                date={day}
                initialAvailability={getInitialAvailability(day)}
                onAvailabilityChange={handleAvailabilityChange}
                className="w-10 h-10 rounded-full"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
