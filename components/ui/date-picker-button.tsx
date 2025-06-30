"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

interface DatePickerButtonProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  className?: string
  buttonClassName?: string
  calendarClassName?: string
  showIcon?: boolean
  placeholder?: string
  disabled?: boolean
}

export function DatePickerButton({
  date,
  onDateChange,
  className = "",
  buttonClassName = "",
  calendarClassName = "",
  showIcon = true,
  placeholder = "Select date",
  disabled = false,
}: DatePickerButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal ${buttonClassName}`}
            disabled={disabled}
            type="button"
          >
            {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
            {date ? format(date, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-auto p-0 ${calendarClassName}`} align="start">
          <div className="p-3 border-b">
            <h3 className="font-medium">Select Date</h3>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              onDateChange(selectedDate || undefined)
              setOpen(false)
            }}
            initialFocus
          />
          <div className="p-3 border-t flex justify-between">
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
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
