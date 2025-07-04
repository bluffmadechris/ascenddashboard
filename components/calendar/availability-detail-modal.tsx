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
  date: Date | null
  endDate: Date | null
  isAvailable: boolean
  startTime: string
  endTime: string
  note?: string
  recurrence?: RecurrenceRule | null
  onSave: (data: {
    isAvailable: boolean
    startTime: string
    endTime: string
    note?: string
    recurrence?: RecurrenceRule | null
  }) => void
}

export function AvailabilityDetailModal({
  open,
  onOpenChange,
  date,
  endDate,
  isAvailable,
  startTime,
  endTime,
  note = "",
  recurrence = null,
  onSave,
}: AvailabilityDetailModalProps) {
  // Local state for form values
  const [localIsAvailable, setLocalIsAvailable] = useState(isAvailable)
  const [localStartTime, setLocalStartTime] = useState(startTime)
  const [localEndTime, setLocalEndTime] = useState(endTime)
  const [localNote, setLocalNote] = useState(note)
  const [localRecurrence, setLocalRecurrence] = useState<RecurrenceRule | null>(recurrence)

  // Update local state when props change
  useEffect(() => {
    setLocalIsAvailable(isAvailable)
    setLocalStartTime(startTime)
    setLocalEndTime(endTime)
    setLocalNote(note)
    setLocalRecurrence(recurrence)
  }, [isAvailable, startTime, endTime, note, recurrence])

  // Handle save
  const handleSave = () => {
    onSave({
      isAvailable: localIsAvailable,
      startTime: localStartTime,
      endTime: localEndTime,
      note: localNote,
      recurrence: localRecurrence,
    })
  }

  // If no date is provided, don't render
  if (!date) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Availability for {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Availability toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="availability">Available</Label>
            <Switch
              id="availability"
              checked={localIsAvailable}
              onCheckedChange={setLocalIsAvailable}
            />
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={localStartTime}
                onChange={(e) => setLocalStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={localEndTime}
                onChange={(e) => setLocalEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Note */}
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              placeholder="Add a note about this availability..."
            />
          </div>

          {/* Save button */}
          <Button onClick={handleSave} className="w-full">
            Save Availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
