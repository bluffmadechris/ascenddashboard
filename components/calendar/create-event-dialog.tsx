"use client"

import { useState, useEffect } from "react"
import { addHours, format, isValid } from "date-fns"
import { CalendarIcon, Clock, Users, MapPin, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import {
  createCalendarEvent,
  getUserCalendarColor,
  getTeamAvailability,
  findCommonAvailableSlots
} from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onEventCreated: () => void
}

export function CreateEventDialog({ open, onOpenChange, selectedDate, onEventCreated }: CreateEventDialogProps) {
  const { user, users } = useAuth()
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(selectedDate || new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(selectedDate || new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [eventType, setEventType] = useState("meeting")
  const [isAllDay, setIsAllDay] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const defaultDate = selectedDate || new Date()
      const defaultEndDate = addHours(defaultDate, 1)

      setTitle("")
      setDescription("")
      setLocation("")
      setStartDate(defaultDate)
      setEndDate(defaultEndDate)
      setStartTime(format(defaultDate, "HH:mm"))
      setEndTime(format(defaultEndDate, "HH:mm"))
      setEventType("meeting")
      setIsAllDay(false)
      setSelectedParticipants([])
      setIsSubmitting(false)
    }
  }, [open, selectedDate])

  // Auto-update end date when start date changes
  useEffect(() => {
    if (startDate && (!endDate || endDate < startDate)) {
      setEndDate(addHours(startDate, 1))
    }
  }, [startDate, endDate])

  // Get combined start date and time
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

  // Get combined end date and time
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

  // Toggle participant selection
  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  // Get team availability for the selected date
  const getSelectedDateTeamAvailability = () => {
    if (selectedParticipants.length === 0 || !startDate) return {}
    return getTeamAvailability(selectedParticipants, startDate)
  }

  // Get common available time slots
  const getCommonAvailableSlots = () => {
    if (selectedParticipants.length === 0 || !startDate) return []
    return findCommonAvailableSlots(selectedParticipants, startDate, 60)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) return

    // Validation
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event title",
        variant: "destructive",
      })
      return
    }

    const start = getStartDateTime()
    const end = getEndDateTime()

    if (!start || !end) {
      toast({
        title: "Error",
        description: "Please select valid start and end times",
        variant: "destructive",
      })
      return
    }

    if (start >= end) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create event using API
      const newEvent = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        type: eventType as any,
        status: "confirmed" as const,
        createdBy: user.id,
        attendees: selectedParticipants,
        allDay: isAllDay,
        color: getUserCalendarColor(user.id),
      }

      const createdEvent = await createCalendarEvent(newEvent)

      if (createdEvent) {
        toast({
          title: "Event created successfully",
          description: "Event has been added to your calendar",
        })

        onEventCreated()
        onOpenChange(false)
      } else {
        throw new Error("Failed to create event")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Apply suggested time slot
  const applySuggestedTime = (slotStartTime: string, slotEndTime: string) => {
    setStartTime(slotStartTime)
    setEndTime(slotEndTime)
  }

  const teamAvailability = getSelectedDateTeamAvailability()
  const availableSlots = getCommonAvailableSlots()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allDay"
              checked={isAllDay}
              onCheckedChange={(checked) => setIsAllDay(!!checked)}
            />
            <Label htmlFor="allDay">All day event</Label>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {!isAllDay && (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {!isAllDay && (
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
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

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location (optional)"
                className="pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${u.id}`}
                      checked={selectedParticipants.includes(u.id)}
                      onCheckedChange={() => toggleParticipant(u.id)}
                    />
                    <Label htmlFor={`user-${u.id}`} className="flex-1 cursor-pointer">
                      {u.name}
                    </Label>
                    <span className="text-xs text-muted-foreground capitalize">
                      {u.role.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Availability Display */}
          {selectedParticipants.length > 0 && startDate && (
            <div className="space-y-2">
              <Label>Team Availability for {format(startDate, "MMM d, yyyy")}</Label>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                {Object.entries(teamAvailability).map(([userId, availability]) => {
                  const user = users.find(u => u.id === userId)
                  return (
                    <div key={userId} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{user?.name || `User ${userId}`}</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${availability.available ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={availability.available ? 'text-green-600' : 'text-red-600'}>
                          {availability.available ? 'Available' : 'Unavailable'}
                        </span>
                        {availability.startTime && availability.endTime && (
                          <span className="text-muted-foreground">
                            {availability.startTime} - {availability.endTime}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Suggested Time Slots */}
                {availableSlots.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Suggested meeting times:</p>
                    <div className="space-y-1">
                      {availableSlots.slice(0, 3).map((slot, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1 mr-2"
                          onClick={() => applySuggestedTime(slot.startTime, slot.endTime)}
                        >
                          {slot.startTime} - {slot.endTime} ({slot.availableUsers.length} available)
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

