"use client"

import { useState } from "react"
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isValid,
} from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { Card } from "../ui/card"

interface CalendarMonthViewProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  events?: CalendarEvent[]
  availability?: any[]
}

export function CalendarMonthView({
  selectedDate,
  onDateSelect,
  events = [],
  availability = []
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const dateFormat = "EEEE"
    const days = []
    const startDate = startOfWeek(currentMonth)

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="font-semibold text-center py-2 border-b">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      )
    }

    return <div className="grid grid-cols-7">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfMonth(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const isSelected = isSameDay(selectedDate, day)
        const isCurrentMonth = isSameMonth(day, monthStart)

        // Find events for this day
        const dayEvents = events.filter(event =>
          isSameDay(new Date(event.date), day)
        )

        // Find availability for this day
        const dayAvailability = availability.find(a =>
          isSameDay(new Date(a.date), day)
        )

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] p-2 border relative ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
              } ${isSelected ? "bg-blue-50" : ""}`}
            onClick={() => onDateSelect(cloneDay)}
          >
            <div className="font-medium">{format(day, "d")}</div>

            {/* Events */}
            <div className="space-y-1 mt-1">
              {dayEvents.map((event, index) => (
                <div
                  key={index}
                  className="text-xs p-1 bg-blue-100 rounded truncate"
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>

            {/* Availability Indicator */}
            {dayAvailability && (
              <div
                className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${dayAvailability.isAvailable ? "bg-green-500" : "bg-red-500"
                  }`}
              />
            )}
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return <div className="flex-1">{rows}</div>
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]"> {/* Minimum width to prevent squishing */}
          {renderDays()}
          {renderCells()}
        </div>
      </div>
    </Card>
  )
}
