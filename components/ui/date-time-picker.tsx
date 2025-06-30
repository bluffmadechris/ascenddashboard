"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateTimePickerProps {
  label?: string
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  showTimeSelect?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  clearable?: boolean
  required?: boolean
  minuteIncrement?: number
  minDate?: Date
  maxDate?: Date
  popoverAlign?: "start" | "center" | "end"
}

export function DateTimePicker({
  label,
  date,
  setDate,
  showTimeSelect = true,
  disabled = false,
  className,
  placeholder = "Select date and time",
  clearable = true,
  required = false,
  minuteIncrement = 15,
  minDate,
  maxDate,
  popoverAlign = "start",
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [hours, setHours] = useState<number>(date ? date.getHours() : 9)
  const [minutes, setMinutes] = useState<number>(
    date ? Math.floor(date.getMinutes() / minuteIncrement) * minuteIncrement : 0,
  )
  const [ampm, setAmPm] = useState<"AM" | "PM">(date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM")

  // Update internal state when date prop changes
  useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setHours(
        date.getHours() >= 12
          ? date.getHours() === 12
            ? 12
            : date.getHours() - 12
          : date.getHours() === 0
            ? 12
            : date.getHours(),
      )
      setMinutes(Math.floor(date.getMinutes() / minuteIncrement) * minuteIncrement)
      setAmPm(date.getHours() >= 12 ? "PM" : "AM")
    } else {
      setSelectedDate(undefined)
    }
  }, [date, minuteIncrement])

  // Update the date when time changes
  useEffect(() => {
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      const isPM = ampm === "PM"
      let hourValue = hours

      // Convert to 24-hour format
      if (isPM && hours !== 12) {
        hourValue = hours + 12
      } else if (!isPM && hours === 12) {
        hourValue = 0
      }

      newDate.setHours(hourValue, minutes, 0, 0)
      setDate(newDate)
    }
  }, [hours, minutes, ampm, selectedDate, setDate])

  // Generate time options
  const generateTimeOptions = () => {
    const hoursOptions = Array.from({ length: 12 }, (_, i) => i + 1)
    const minutesOptions = Array.from({ length: Math.floor(60 / minuteIncrement) }, (_, i) => i * minuteIncrement)

    return {
      hours: hoursOptions,
      minutes: minutesOptions,
      ampm: ["AM", "PM"] as const,
    }
  }

  const timeOptions = generateTimeOptions()

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date)

      // If we already had a date selected, preserve the time
      if (selectedDate) {
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0)
      } else {
        // Default time if no previous date
        const isPM = ampm === "PM"
        let hourValue = hours

        if (isPM && hours !== 12) {
          hourValue = hours + 12
        } else if (!isPM && hours === 12) {
          hourValue = 0
        }

        newDate.setHours(hourValue, minutes, 0, 0)
      }

      setSelectedDate(newDate)
      setDate(newDate)
      setCalendarOpen(false)

      // If time selection is enabled, open time popover after date selection
      if (showTimeSelect) {
        setTimeout(() => setTimeOpen(true), 100)
      }
    } else {
      setSelectedDate(undefined)
      setDate(undefined)
    }
  }

  // Handle time selection
  const handleTimeChange = (type: "hours" | "minutes" | "ampm", value: any) => {
    if (type === "hours") {
      setHours(Number(value))
    } else if (type === "minutes") {
      setMinutes(Number(value))
    } else if (type === "ampm") {
      setAmPm(value as "AM" | "PM")
    }
  }

  // Format the display value
  const getFormattedValue = () => {
    if (!selectedDate) return ""

    const dateFormat = "MMM d, yyyy"
    const timeFormat = "h:mm a"

    if (showTimeSelect) {
      return format(selectedDate, `${dateFormat} ${timeFormat}`)
    }

    return format(selectedDate, dateFormat)
  }

  // Clear the selection
  const handleClear = () => {
    setSelectedDate(undefined)
    setDate(undefined)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        {/* Date Picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align={popoverAlign}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={disabled}
              minDate={minDate}
              maxDate={maxDate}
            />
            {clearable && selectedDate && (
              <div className="p-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Time Picker */}
        {showTimeSelect && (
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled || !selectedDate}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  (!selectedDate || disabled) && "opacity-50 cursor-not-allowed",
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "h:mm a") : "Select time"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-3" align={popoverAlign}>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Hour</Label>
                    <Select
                      value={hours.toString()}
                      onValueChange={(value) => handleTimeChange("hours", value)}
                      disabled={!selectedDate || disabled}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.hours.map((hour) => (
                          <SelectItem key={`hour-${hour}`} value={hour.toString()}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Minute</Label>
                    <Select
                      value={minutes.toString()}
                      onValueChange={(value) => handleTimeChange("minutes", value)}
                      disabled={!selectedDate || disabled}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.minutes.map((minute) => (
                          <SelectItem key={`minute-${minute}`} value={minute.toString()}>
                            {minute.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">AM/PM</Label>
                    <Select
                      value={ampm}
                      onValueChange={(value) => handleTimeChange("ampm", value)}
                      disabled={!selectedDate || disabled}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.ampm.map((period) => (
                          <SelectItem key={`period-${period}`} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="w-full" onClick={() => setTimeOpen(false)}>
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}
