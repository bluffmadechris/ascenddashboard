"use client"

import { useState, useEffect } from "react"
import { format, isBefore } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Clock, AlertCircle, CalendarIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RecurrenceEditor } from "@/components/calendar/recurrence-editor"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { RecurrenceRule } from "@/lib/calendar-utils"

interface AvailabilityDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  endDate?: Date
  isAvailable: boolean
  onSave: (data: {
    isAvailable: boolean
    startDate: Date
    endDate: Date
    startTime: string
    endTime: string
    note: string
    recurrence?: RecurrenceRule
  }) => void
  defaultStartTime?: string
  defaultEndTime?: string
  note?: string
  recurrence?: RecurrenceRule
}

export function AvailabilityDetailModal({
  open,
  onOpenChange,
  date,
  endDate,
  isAvailable: initialIsAvailable,
  onSave,
  defaultStartTime = "09:00",
  defaultEndTime = "17:00",
  note = "",
  recurrence,
}: AvailabilityDetailModalProps) {
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable)
  const [startDate, setStartDate] = useState<Date>(date)
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(endDate || date)
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [endTime, setEndTime] = useState(defaultEndTime)
  const [noteText, setNoteText] = useState(note)
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(recurrence)
  const [isTimeValid, setIsTimeValid] = useState(true)
  const [isDateRangeValid, setIsDateRangeValid] = useState(true)

  const [startCalendarOpen, setStartCalendarOpen] = useState(false)
  const [endCalendarOpen, setEndCalendarOpen] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setIsAvailable(initialIsAvailable)
      setStartDate(date)
      setSelectedEndDate(endDate || date)
      setStartTime(defaultStartTime)
      setEndTime(defaultEndTime)
      setNoteText(note)
      setRecurrenceRule(recurrence)
    }
  }, [open, initialIsAvailable, date, endDate, defaultStartTime, defaultEndTime, note, recurrence])

  // Validate time range
  useEffect(() => {
    setIsTimeValid(startTime < endTime)
  }, [startTime, endTime])

  // Validate date range
  useEffect(() => {
    setIsDateRangeValid(!isBefore(selectedEndDate, startDate))
  }, [startDate, selectedEndDate])

  const handleSave = () => {
    if (!isTimeValid || !isDateRangeValid) return

    onSave({
      isAvailable,
      startDate,
      endDate: selectedEndDate,
      startTime,
      endTime,
      note: noteText,
      recurrence: recurrenceRule,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Availability for {format(startDate, "EEEE, MMMM d, yyyy")}
            {!isBefore(selectedEndDate, startDate) && startDate.getTime() !== selectedEndDate.getTime() && (
              <> to {format(selectedEndDate, "EEEE, MMMM d, yyyy")}</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="availability-toggle" className="text-base">
              {isAvailable ? "Available" : "Unavailable"}
            </Label>
            <Switch id="availability-toggle" checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        // If end date is before new start date, update it
                        if (isBefore(selectedEndDate, date)) {
                          setSelectedEndDate(date)
                        }
                      }
                      setStartCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedEndDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedEndDate ? format(selectedEndDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={(date) => {
                      if (date) setSelectedEndDate(date)
                      setEndCalendarOpen(false)
                    }}
                    disabled={(date) => isBefore(date, startDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {!isDateRangeValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>End date must be on or after start date</AlertDescription>
            </Alert>
          )}

          {isAvailable && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              </div>

              {!isTimeValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>End time must be after start time</AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Add a note about your availability (optional)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Recurrence</Label>
            <RecurrenceEditor recurrence={recurrenceRule} onChange={setRecurrenceRule} startDate={startDate} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={(isAvailable && !isTimeValid) || !isDateRangeValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
