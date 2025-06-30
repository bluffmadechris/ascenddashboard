"use client"

import { useState, useEffect } from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EnhancedDatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  minDate?: Date
  maxDate?: Date
  disabledDates?: (date: Date) => boolean
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  label,
  placeholder = "Select date",
  disabled = false,
  error,
  required = false,
  className,
  align = "start",
  side = "bottom",
  minDate,
  maxDate,
  disabledDates,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("calendar")
  const [manualInput, setManualInput] = useState("")
  const [manualInputError, setManualInputError] = useState<string | null>(null)

  // Update manual input when date changes
  useEffect(() => {
    if (date && isValid(date)) {
      setManualInput(format(date, "MM/dd/yyyy"))
    } else {
      setManualInput("")
    }
  }, [date])

  // Handle manual input change
  const handleManualInputChange = (value: string) => {
    setManualInput(value)

    if (!value.trim()) {
      setManualInputError(null)
      return
    }

    try {
      // Try to parse with different formats
      const formats = ["MM/dd/yyyy", "M/d/yyyy", "MM-dd-yyyy", "yyyy-MM-dd"]
      let parsedDate: Date | null = null

      for (const fmt of formats) {
        try {
          const tempDate = parse(value, fmt, new Date())
          if (isValid(tempDate)) {
            parsedDate = tempDate
            break
          }
        } catch (e) {
          // Continue trying other formats
        }
      }

      if (parsedDate && isValid(parsedDate)) {
        setManualInputError(null)
      } else {
        setManualInputError("Please enter a valid date (MM/DD/YYYY)")
      }
    } catch (error) {
      setManualInputError("Please enter a valid date (MM/DD/YYYY)")
    }
  }

  // Apply manual input
  const applyManualInput = () => {
    if (!manualInput.trim()) {
      onDateChange(undefined)
      setOpen(false)
      return
    }

    try {
      // Try to parse with different formats
      const formats = ["MM/dd/yyyy", "M/d/yyyy", "MM-dd-yyyy", "yyyy-MM-dd"]
      let parsedDate: Date | null = null

      for (const fmt of formats) {
        try {
          const tempDate = parse(manualInput, fmt, new Date())
          if (isValid(tempDate)) {
            parsedDate = tempDate
            break
          }
        } catch (e) {
          // Continue trying other formats
        }
      }

      if (parsedDate && isValid(parsedDate)) {
        // Check if date is within min/max constraints
        if (minDate && parsedDate < minDate) {
          setManualInputError(`Date cannot be before ${format(minDate, "MM/dd/yyyy")}`)
          return
        }

        if (maxDate && parsedDate > maxDate) {
          setManualInputError(`Date cannot be after ${format(maxDate, "MM/dd/yyyy")}`)
          return
        }

        // Check custom disabled dates
        if (disabledDates && disabledDates(parsedDate)) {
          setManualInputError("This date is not available")
          return
        }

        onDateChange(parsedDate)
        setManualInputError(null)
        setOpen(false)
      } else {
        setManualInputError("Please enter a valid date (MM/DD/YYYY)")
      }
    } catch (error) {
      setManualInputError("Please enter a valid date (MM/DD/YYYY)")
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-destructive",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMMM d, yyyy") : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align={align} side={side}>
          <div className="p-2 border-b">
            <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="manual">Manual Input</TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={onDateChange}
                  disabled={disabled || disabledDates}
                  minDate={minDate}
                  maxDate={maxDate}
                  initialFocus
                />
              </TabsContent>

              <TabsContent value="manual" className="mt-2 space-y-2">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="manual-date-input">Enter date manually:</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="manual-date-input"
                      placeholder="MM/DD/YYYY"
                      value={manualInput}
                      onChange={(e) => handleManualInputChange(e.target.value)}
                      className={cn(manualInputError && "border-destructive")}
                    />
                    <Button size="sm" onClick={applyManualInput} disabled={!!manualInputError}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  {manualInputError && <p className="text-xs text-destructive">{manualInputError}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY, YYYY-MM-DD
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-2 border-t flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateChange(undefined)
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateChange(new Date())
                setOpen(false)
              }}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
