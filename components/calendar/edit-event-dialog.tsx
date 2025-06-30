"use client"

import { useState, useEffect } from "react"
import {
  format,
  parseISO,
  isSameDay,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  isBefore,
} from "date-fns"
import { MapPinIcon, AlignLeftIcon, BellIcon, RepeatIcon, ClockIcon, XIcon, PlusIcon, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { updateCalendarEvent, type CalendarEvent } from "@/lib/calendar-utils"
import { RecurrenceEditor } from "./recurrence-editor"
import type { Reminder } from "./reminders-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"

interface EditEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onEventUpdated: () => void
}

export function EditEventDialog({ open, onOpenChange, event, onEventUpdated }: EditEventDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // Form state
  const [formStep, setFormStep] = useState(1)
  const [title, setTitle] = useState(event.title)
  const [startDate, setStartDate] = useState<Date | undefined>(parseISO(event.start))
  const [startTime, setStartTime] = useState(format(parseISO(event.start), "HH:mm"))
  const [endDate, setEndDate] = useState<Date | undefined>(parseISO(event.end))
  const [endTime, setEndTime] = useState(format(parseISO(event.end), "HH:mm"))
  const [location, setLocation] = useState(event.location || "")
  const [description, setDescription] = useState(event.description || "")
  const [eventType, setEventType] = useState<"meeting" | "personal" | "holiday">((event.type as any) || "meeting")
  const [isRecurring, setIsRecurring] = useState(event.isRecurring || false)
  const [dateError, setDateError] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState(
    event.recurrence || {
      frequency: "weekly",
      interval: 1,
      ends: "never",
      count: 10,
      until: parseISO(event.end),
      weekdays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    },
  )
  const [reminders, setReminders] = useState<Reminder[]>(
    event.reminders || [{ id: "default", type: "notification", time: 15, unit: "minutes" }],
  )

  // UI state
  const [quickDates, setQuickDates] = useState<Date[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setStartDate(parseISO(event.start))
      setStartTime(format(parseISO(event.start), "HH:mm"))
      setEndDate(parseISO(event.end))
      setEndTime(format(parseISO(event.end), "HH:mm"))
      setLocation(event.location || "")
      setDescription(event.description || "")
      setEventType((event.type as any) || "meeting")
      setIsRecurring(event.isRecurring || false)
      setFormStep(1)
      setIsSubmitting(false)
      setDateError(null)
      setRecurrence(
        event.recurrence || {
          frequency: "weekly",
          interval: 1,
          ends: "never",
          count: 10,
          until: parseISO(event.end),
          weekdays: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
          },
        },
      )
      setReminders(event.reminders || [{ id: "default", type: "notification", time: 15, unit: "minutes" }])

      // Generate quick dates based on the event start date
      generateQuickDates(parseISO(event.start))
    }
  }, [event])

  // Validate dates whenever they change
  useEffect(() => {
    validateDates()
  }, [startDate, endDate, startTime, endTime])

  // Function to validate dates
  const validateDates = () => {
    setDateError(null)

    if (!startDate || !endDate) return true

    const start = combineDateTime(startDate, startTime)
    const end = combineDateTime(endDate, endTime)

    if (isBefore(end, start)) {
      setDateError("End time must be after start time")
      return false
    }

    return true
  }

  // Generate quick date selection options
  const generateQuickDates = (baseDate: Date) => {
    const today = new Date()
    const dates: Date[] = []

    // Add today
    dates.push(today)

    // Add next 6 days
    for (let i = 1; i <= 6; i++) {
      dates.push(addDays(today, i))
    }

    // Add the selected date if it's not in the range
    if (!dates.some((date) => isSameDay(date, baseDate))) {
      dates.push(baseDate)
      // Sort dates chronologically
      dates.sort((a, b) => a.getTime() - b.getTime())
    }

    setQuickDates(dates)
  }

  // Get event color based on type
  const getEventColor = () => {
    switch (eventType) {
      case "meeting":
        return "#3b82f6" // Blue
      case "personal":
        return "#22c55e" // Green
      case "holiday":
        return "#ef4444" // Red
      default:
        return "#3b82f6" // Blue
    }
  }

  // Combine date and time
  const combineDateTime = (date: Date | undefined, timeString: string) => {
    if (!date) return new Date()

    const [hours, minutes] = timeString.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }

  // Navigate quick dates
  const navigateQuickDates = (direction: "prev" | "next") => {
    if (quickDates.length === 0) return

    const firstDate = quickDates[0]
    const lastDate = quickDates[quickDates.length - 1]

    if (direction === "prev") {
      const newDates = Array.from({ length: 7 }, (_, i) => subDays(firstDate, 7 - i))
      setQuickDates(newDates)
    } else {
      const newDates = Array.from({ length: 7 }, (_, i) => addDays(lastDate, i + 1))
      setQuickDates(newDates)
    }
  }

  // Handle quick date selection
  const handleQuickDateSelect = (date: Date, type: "start" | "end") => {
    if (type === "start") {
      setStartDate(date)
      // If end date is before start date, update it
      if (endDate && date > endDate) {
        setEndDate(date)
      }
    } else {
      setEndDate(date)
      // If start date is after end date, update it
      if (startDate && date < startDate) {
        setStartDate(date)
      }
    }
  }

  // Check if a date is within the current week
  const isCurrentWeek = (date: Date) => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    return isWithinInterval(date, { start: weekStart, end: weekEnd })
  }

  // Validate form
  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter an event title",
        variant: "destructive",
      })
      return false
    }

    if (!startDate || !endDate) {
      toast({
        title: "Missing date",
        description: "Please select start and end dates",
        variant: "destructive",
      })
      return false
    }

    if (!validateDates()) {
      toast({
        title: "Invalid time range",
        description: dateError,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user || !validateForm()) return

    try {
      setIsSubmitting(true)

      const start = combineDateTime(startDate!, startTime)
      const end = combineDateTime(endDate!, endTime)

      const updatedEvent = {
        ...event,
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        location,
        description,
        type: eventType,
        color: getEventColor(),
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        reminders,
      }

      updateCalendarEvent(updatedEvent)

      // Simulate a slight delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Event updated",
        description: "Your event has been successfully updated",
      })

      onEventUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step
  const handleNextStep = () => {
    if (formStep === 1 && !title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter an event title",
        variant: "destructive",
      })
      return
    }

    if (formStep < 2) {
      setFormStep(formStep + 1)
    } else {
      handleSubmit()
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-[#0f172a] border-[#1e293b] text-white">
        <DialogHeader className="px-6 py-4 border-b border-[#1e293b]">
          <DialogTitle className="text-xl font-semibold text-white">Edit Event</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 overflow-y-auto max-h-[calc(80vh-8rem)]">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  formStep === 1 ? "bg-blue-600 text-white" : "bg-blue-600/20 text-blue-400",
                )}
              >
                1
              </div>
              <div className={cn("h-1 w-8 rounded-full", formStep === 2 ? "bg-blue-600" : "bg-blue-600/20")} />
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  formStep === 2 ? "bg-blue-600 text-white" : "bg-blue-600/20 text-blue-400",
                )}
              >
                2
              </div>
            </div>
            <div className="text-sm text-slate-400">Step {formStep} of 2</div>
          </div>

          {formStep === 1 ? (
            <div className="space-y-6">
              {/* Title input */}
              <div className="space-y-2">
                <Label htmlFor="event-title" className="text-sm font-medium text-slate-300">
                  Event Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event-title"
                  placeholder="Add title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 h-12"
                  autoFocus
                />
              </div>

              {/* Date selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EnhancedDatePicker
                    label="Start Date"
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Select start date"
                    error={dateError && dateError.includes("start") ? dateError : undefined}
                    className="bg-[#1e293b] border-[#334155] text-white"
                  />

                  <EnhancedDatePicker
                    label="End Date"
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder="Select end date"
                    error={dateError && dateError.includes("end") ? dateError : undefined}
                    minDate={startDate}
                    className="bg-[#1e293b] border-[#334155] text-white"
                  />
                </div>

                {/* Time selection */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">Start Time</Label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="pl-10 bg-[#1e293b] border-[#334155] text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">End Time</Label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="pl-10 bg-[#1e293b] border-[#334155] text-white"
                      />
                    </div>
                  </div>
                </div>

                {dateError && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{dateError}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Event type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-300">Event Type</Label>
                <Select value={eventType} onValueChange={(value) => setEventType(value as any)}>
                  <SelectTrigger className="bg-[#1e293b] border-[#334155] text-white">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-[#334155] text-white">
                    <SelectItem value="meeting" className="focus:bg-blue-600/20 focus:text-white">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        Meeting
                      </div>
                    </SelectItem>
                    <SelectItem value="personal" className="focus:bg-blue-600/20 focus:text-white">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        Personal
                      </div>
                    </SelectItem>
                    <SelectItem value="holiday" className="focus:bg-blue-600/20 focus:text-white">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        Holiday
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recurring option */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RepeatIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Repeat</span>
                </div>
                <Button
                  variant="ghost"
                  className="h-8 text-slate-300 hover:bg-[#334155] hover:text-white"
                  onClick={() => setIsRecurring(!isRecurring)}
                >
                  {isRecurring ? "Recurring event" : "Does not repeat"}
                </Button>
              </div>

              {isRecurring && (
                <div className="pl-6 pt-2">
                  <RecurrenceEditor
                    recurrence={recurrence}
                    onChange={setRecurrence}
                    startDate={startDate || new Date()}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="event-location" className="text-sm font-medium text-slate-300">
                  Location
                </Label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="event-location"
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 h-12"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="event-description" className="text-sm font-medium text-slate-300">
                  Description
                </Label>
                <div className="relative">
                  <AlignLeftIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Textarea
                    id="event-description"
                    placeholder="Add description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="pl-10 min-h-[120px] bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Reminders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BellIcon className="h-4 w-4 text-slate-400" />
                    <Label className="text-sm font-medium text-slate-300">Reminders</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-[#1e293b] border-[#334155] hover:bg-[#334155] text-slate-300"
                    onClick={() => {
                      setReminders([
                        ...reminders,
                        { id: `reminder-${Date.now()}`, type: "notification", time: 15, unit: "minutes" },
                      ])
                    }}
                  >
                    <PlusIcon className="h-3.5 w-3.5 mr-1" />
                    Add Reminder
                  </Button>
                </div>

                <div className="space-y-2">
                  {reminders.map((reminder, index) => (
                    <div key={reminder.id} className="flex items-center space-x-2">
                      <Select
                        value={reminder.type}
                        onValueChange={(value) => {
                          const newReminders = [...reminders]
                          newReminders[index] = { ...reminder, type: value as "notification" | "email" }
                          setReminders(newReminders)
                        }}
                      >
                        <SelectTrigger className="bg-[#1e293b] border-[#334155] text-white w-[140px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-[#334155] text-white">
                          <SelectItem value="notification" className="focus:bg-blue-600/20 focus:text-white">
                            Notification
                          </SelectItem>
                          <SelectItem value="email" className="focus:bg-blue-600/20 focus:text-white">
                            Email
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        min="1"
                        value={reminder.time}
                        onChange={(e) => {
                          const newReminders = [...reminders]
                          newReminders[index] = { ...reminder, time: Number.parseInt(e.target.value) || 1 }
                          setReminders(newReminders)
                        }}
                        className="w-[80px] bg-[#1e293b] border-[#334155] text-white"
                      />

                      <Select
                        value={reminder.unit}
                        onValueChange={(value) => {
                          const newReminders = [...reminders]
                          newReminders[index] = { ...reminder, unit: value as "minutes" | "hours" | "days" }
                          setReminders(newReminders)
                        }}
                      >
                        <SelectTrigger className="bg-[#1e293b] border-[#334155] text-white w-[120px]">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-[#334155] text-white">
                          <SelectItem value="minutes" className="focus:bg-blue-600/20 focus:text-white">
                            Minutes
                          </SelectItem>
                          <SelectItem value="hours" className="focus:bg-blue-600/20 focus:text-white">
                            Hours
                          </SelectItem>
                          <SelectItem value="days" className="focus:bg-blue-600/20 focus:text-white">
                            Days
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {reminders.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            setReminders(reminders.filter((_, i) => i !== index))
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Event summary */}
              <div className="mt-6 p-4 bg-[#1e293b]/50 rounded-lg border border-[#334155] space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Event Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Badge
                      className={cn(
                        "mr-2",
                        eventType === "meeting"
                          ? "bg-blue-500"
                          : eventType === "personal"
                            ? "bg-green-500"
                            : "bg-red-500",
                      )}
                    >
                      {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                    </Badge>
                    <span className="font-medium">{title || "Untitled Event"}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                    {startDate && endDate ? (
                      isSameDay(startDate, endDate) ? (
                        <span>
                          {format(startDate, "EEE, MMM d")} · {startTime} - {endTime}
                        </span>
                      ) : (
                        <span>
                          {format(startDate, "EEE, MMM d")} {startTime} - {format(endDate, "EEE, MMM d")} {endTime}
                        </span>
                      )
                    ) : (
                      <span>Date not selected</span>
                    )}
                  </div>
                  {location && (
                    <div className="flex items-center text-sm text-slate-400">
                      <MapPinIcon className="h-3.5 w-3.5 mr-1.5" />
                      <span>{location}</span>
                    </div>
                  )}
                  {isRecurring && (
                    <div className="flex items-center text-sm text-slate-400">
                      <RepeatIcon className="h-3.5 w-3.5 mr-1.5" />
                      <span>Recurring event</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-sm">
          <div className="flex justify-between w-full">
            {formStep === 1 ? (
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-slate-300 hover:text-white hover:bg-[#334155]"
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="bg-[#1e293b] border-[#334155] hover:bg-[#334155] text-slate-300"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNextStep}
              disabled={isSubmitting || !!dateError}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : formStep === 2 ? (
                "Update Event"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
