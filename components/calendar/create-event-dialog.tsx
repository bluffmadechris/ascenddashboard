"use client"

import { useState, useEffect } from "react"
import { addHours, isValid, isBefore } from "date-fns"
import { Clock, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { createCalendarEvent, getEventTypeColor } from "@/lib/calendar-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserAvailabilitySelector } from "./user-availability-selector"
import { UserAvailabilityDisplay } from "./user-availability-display"
import { checkUsersAvailability, type AvailabilityConflict } from "@/lib/availability-utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onEventCreated: () => void
}

export function CreateEventDialog({ open, onOpenChange, selectedDate, onEventCreated }: CreateEventDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // Event form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(selectedDate || new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(
    selectedDate ? addHours(selectedDate, 1) : addHours(new Date(), 1),
  )
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [location, setLocation] = useState("")
  const [eventType, setEventType] = useState<"meeting" | "task" | "reminder" | "out-of-office" | "personal">("meeting")
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isAllDay, setIsAllDay] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)

  // Availability checking
  const [availabilityConflicts, setAvailabilityConflicts] = useState<AvailabilityConflict[]>([])
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [overrideAvailability, setOverrideAvailability] = useState(false)

  // Reset form when dialog opens or selected date changes
  useEffect(() => {
    if (open) {
      if (selectedDate && isValid(selectedDate)) {
        setStartDate(selectedDate)
        setEndDate(addHours(selectedDate, 1))

        // Set times based on the selected date
        setStartTime(
          selectedDate.getHours().toString().padStart(2, "0") +
            ":" +
            selectedDate.getMinutes().toString().padStart(2, "0"),
        )

        const endTime = addHours(selectedDate, 1)
        setEndTime(
          endTime.getHours().toString().padStart(2, "0") + ":" + endTime.getMinutes().toString().padStart(2, "0"),
        )
      } else {
        // Default to current time
        const now = new Date()
        setStartDate(now)
        setEndDate(addHours(now, 1))

        setStartTime(now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0"))

        const endTime = addHours(now, 1)
        setEndTime(
          endTime.getHours().toString().padStart(2, "0") + ":" + endTime.getMinutes().toString().padStart(2, "0"),
        )
      }

      setTitle("")
      setDescription("")
      setLocation("")
      setEventType("meeting")
      setSelectedParticipants([])
      setIsAllDay(false)
      setAvailabilityConflicts([])
      setOverrideAvailability(false)
      setDateError(null)
    }
  }, [open, selectedDate])

  // Check availability when participants or time changes
  useEffect(() => {
    if (selectedParticipants.length === 0 || !startDate || !endDate) {
      setAvailabilityConflicts([])
      return
    }

    setIsCheckingAvailability(true)

    // Get the actual start and end times
    const start = getStartDateTime()
    const end = getEndDateTime()

    if (!start || !end) {
      setIsCheckingAvailability(false)
      return
    }

    // Check availability for all participants
    const { conflicts } = checkUsersAvailability(selectedParticipants, start, end)
    setAvailabilityConflicts(conflicts)
    setIsCheckingAvailability(false)
  }, [selectedParticipants, startDate, endDate, startTime, endTime])

  // Validate dates
  useEffect(() => {
    validateDates()
  }, [startDate, endDate, startTime, endTime])

  // Function to validate dates
  const validateDates = () => {
    setDateError(null)

    if (!startDate || !endDate) return true

    const start = getStartDateTime()
    const end = getEndDateTime()

    if (!start || !end) return true

    if (isBefore(end, start)) {
      setDateError("End time must be after start time")
      return false
    }

    return true
  }

  // Get start date and time as Date object
  const getStartDateTime = () => {
    if (!startDate) return null

    if (isAllDay) {
      const date = new Date(startDate)
      date.setHours(0, 0, 0, 0)
      return date
    }

    const date = new Date(startDate)
    const [hours, minutes] = startTime.split(":").map(Number)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  // Get end date and time as Date object
  const getEndDateTime = () => {
    if (!endDate) return null

    if (isAllDay) {
      const date = new Date(endDate)
      date.setHours(23, 59, 59, 999)
      return date
    }

    const date = new Date(endDate)
    const [hours, minutes] = endTime.split(":").map(Number)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Handle form submission
  const handleCreateEvent = async () => {
    if (!user) return

    try {
      // Validate form
      if (!title.trim()) {
        toast({
          title: "Error",
          description: "Please enter an event title",
          variant: "destructive",
        })
        return
      }

      if (!validateDates()) {
        toast({
          title: "Error",
          description: dateError,
          variant: "destructive",
        })
        return
      }

      const start = getStartDateTime()
      const end = getEndDateTime()

      if (!start || !end) {
        toast({
          title: "Error",
          description: "Invalid date or time",
          variant: "destructive",
        })
        return
      }

      // Check for availability conflicts
      if (availabilityConflicts.length > 0 && !overrideAvailability) {
        toast({
          title: "Availability Conflict",
          description:
            "One or more participants are unavailable during this time. Please check availability or override.",
          variant: "destructive",
        })
        return
      }

      // Create calendar event
      const newEvent = {
        title,
        description,
        start: start.toISOString(),
        end: end.toISOString(),
        location,
        type: eventType,
        status: "confirmed" as const,
        createdBy: user.id,
        attendees: selectedParticipants,
        allDay: isAllDay,
        color: getEventTypeColor(eventType),
      }

      createCalendarEvent(newEvent)

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      onEventCreated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10">
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-grow px-6 pb-2">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="isAllDay" className="flex items-center cursor-pointer space-x-2">
                <input
                  id="isAllDay"
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="form-checkbox h-4 w-4"
                />
                <span>All day event</span>
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <EnhancedDatePicker
                  label="Start Date"
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="Select start date"
                  error={dateError && dateError.includes("start") ? dateError : undefined}
                />

                {!isAllDay && (
                  <div className="relative">
                    <Label htmlFor="startTime">Start Time</Label>
                    <div className="flex items-center mt-1">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <EnhancedDatePicker
                  label="End Date"
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="Select end date"
                  error={dateError && dateError.includes("end") ? dateError : undefined}
                  minDate={startDate}
                />

                {!isAllDay && (
                  <div className="relative">
                    <Label htmlFor="endTime">End Time</Label>
                    <div className="flex items-center mt-1">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {dateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{dateError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={(value) => setEventType(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="out-of-office">Out of Office</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              <UserAvailabilitySelector selectedUsers={selectedParticipants} onSelectUsers={setSelectedParticipants} />
            </div>

            {selectedParticipants.length > 0 && startDate && (
              <UserAvailabilityDisplay userIds={selectedParticipants} date={startDate} className="mt-4" />
            )}

            {availabilityConflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Availability Conflicts</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <p>The following participants are unavailable during the selected time:</p>
                    <ScrollArea className="h-[100px] w-full rounded-md border p-2">
                      {availabilityConflicts.map((conflict, index) => (
                        <div key={index} className="flex items-start space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{getInitials(conflict.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{conflict.userName}</p>
                            <p className="text-sm text-muted-foreground">{conflict.reason}</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="flex items-center space-x-2">
                      <input
                        id="override"
                        type="checkbox"
                        checked={overrideAvailability}
                        onChange={(e) => setOverrideAvailability(e.target.checked)}
                        className="form-checkbox h-4 w-4"
                      />
                      <Label htmlFor="override" className="cursor-pointer">
                        Override availability conflicts and schedule anyway
                      </Label>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateEvent} disabled={!!dateError}>
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
