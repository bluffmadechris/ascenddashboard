"use client"
import { format, parse, isValid } from "date-fns"
import type React from "react"

import { CalendarIcon, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react"

interface CalendarDatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  placeholder?: string
  align?: "start" | "center" | "end"
}

export function CalendarDatePicker({
  date,
  onDateChange,
  open,
  onOpenChange,
  title = "Select Date",
  placeholder = "Select date",
  align = "start",
}: CalendarDatePickerProps) {
  const [manualInput, setManualInput] = useState(false)
  const [dateText, setDateText] = useState(date ? format(date, "MMMM do, yyyy") : "")
  const [isValidDate, setIsValidDate] = useState(true)

  // Update dateText when date prop changes
  useEffect(() => {
    if (date) {
      setDateText(format(date, "MMMM do, yyyy"))
    }
  }, [date])

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDateText(value)

    try {
      // Try to parse the date with various formats
      const parsedDate = parse(value, "MMMM do, yyyy", new Date())

      if (isValid(parsedDate)) {
        setIsValidDate(true)
        // Preserve time if there's an existing date
        if (date) {
          parsedDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
        }
      } else {
        setIsValidDate(false)
      }
    } catch (error) {
      setIsValidDate(false)
    }
  }

  const confirmManualDate = () => {
    try {
      const parsedDate = parse(dateText, "MMMM do, yyyy", new Date())

      if (isValid(parsedDate)) {
        // Preserve time if there's an existing date
        if (date) {
          parsedDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
        }
        onDateChange(parsedDate)
        setIsValidDate(true)
        setManualInput(false)
      } else {
        setIsValidDate(false)
      }
    } catch (error) {
      setIsValidDate(false)
    }
  }

  const cancelManualInput = () => {
    if (date) {
      setDateText(format(date, "MMMM do, yyyy"))
    } else {
      setDateText("")
    }
    setIsValidDate(true)
    setManualInput(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal relative group"
          onClick={() => onOpenChange(true)}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM do, yyyy") : placeholder}
          <span className="absolute inset-0 rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:bg-accent/10" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-2" align={align}>
        <div className="p-3 border-b bg-muted/20">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="flex items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs ${!manualInput ? "bg-accent/50" : ""}`}
              onClick={() => setManualInput(false)}
            >
              Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs ml-2 ${manualInput ? "bg-accent/50" : ""}`}
              onClick={() => setManualInput(true)}
            >
              Manual Input
            </Button>
          </div>
        </div>

        {manualInput ? (
          <div className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter date manually:</label>
              <div className="flex">
                <input
                  type="text"
                  value={dateText}
                  onChange={handleManualDateChange}
                  placeholder="e.g. January 1st, 2025"
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!isValidDate ? "border-red-500" : "border-input"}`}
                />
              </div>
              {!isValidDate && (
                <p className="text-xs text-red-500">Please enter a valid date (e.g. January 1st, 2025)</p>
              )}
              <p className="text-xs text-muted-foreground">Format: Month Day, Year (e.g. January 1st, 2025)</p>
              <div className="flex justify-end space-x-2 mt-2">
                <Button size="sm" variant="outline" onClick={cancelManualInput} className="h-8">
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={confirmManualDate} className="h-8" disabled={!isValidDate}>
                  <Check className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  // Preserve time if there's an existing date
                  const newDate = new Date(selectedDate)
                  if (date) {
                    newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
                  }
                  onDateChange(newDate)
                  onOpenChange(false)
                }
              }}
              initialFocus
              className="rounded-md border-0"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day: "rounded-md h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              }}
            />
            <div className="flex justify-between p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDateChange(undefined)
                  onOpenChange(false)
                }}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  if (date) {
                    // Preserve time
                    today.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
                  }
                  onDateChange(today)
                  onOpenChange(false)
                }}
              >
                Today
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
