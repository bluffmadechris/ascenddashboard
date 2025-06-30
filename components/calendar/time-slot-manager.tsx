"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  type UnavailableTimeSlot,
  loadUserAvailability,
  createUnavailableTimeSlot,
  deleteUnavailableTimeSlot,
  type RecurrenceRule,
} from "@/lib/calendar-utils"
import { Clock, Plus, Trash2, MoreHorizontal, X, CalendarIcon, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RecurrenceEditor } from "@/components/calendar/recurrence-editor"

interface TimeSlotManagerProps {
  date?: Date
  onClose?: () => void
}

export function TimeSlotManager({ date: initialDate, onClose }: TimeSlotManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate || new Date())
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableTimeSlot[]>([])
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [titleIsOpen, setTitleIsOpen] = useState(false)

  // New slot state
  const [newSlotStartTime, setNewSlotStartTime] = useState("09:00")
  const [newSlotEndTime, setNewSlotEndTime] = useState("17:00")
  const [newSlotTitle, setNewSlotTitle] = useState("")
  const [newSlotRecurrence, setNewSlotRecurrence] = useState<RecurrenceRule | undefined>(undefined)

  // Load unavailable slots for the selected date
  useEffect(() => {
    if (!user || !selectedDate) return

    try {
      const availability = loadUserAvailability(user.id)
      if (availability) {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const slotsForDate = availability.unavailableSlots.filter((slot) => slot.date === dateStr)
        setUnavailableSlots(slotsForDate)
      }
    } catch (error) {
      console.error("Error loading unavailable slots:", error)
    }
  }, [user, selectedDate])

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
  }

  // Add a new unavailable slot
  const handleAddSlot = () => {
    if (!user || !selectedDate) return

    // Validate times
    if (newSlotStartTime >= newSlotEndTime) {
      toast({
        title: "Invalid times",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")

      const newSlot: Omit<UnavailableTimeSlot, "id"> = {
        date: dateStr,
        startTime: newSlotStartTime,
        endTime: newSlotEndTime,
        title: newSlotTitle.trim(),
        recurring: newSlotRecurrence,
      }

      const createdSlot = createUnavailableTimeSlot(user.id, newSlot)

      if (createdSlot) {
        // Refresh the list
        const availability = loadUserAvailability(user.id)
        if (availability) {
          const slotsForDate = availability.unavailableSlots.filter((slot) => slot.date === dateStr)
          setUnavailableSlots(slotsForDate)
        }

        // Reset form
        setNewSlotTitle("")
        setNewSlotRecurrence(undefined)
        setIsAddingSlot(false)

        toast({
          title: "Time slot added",
          description: "Your unavailable time slot has been saved",
        })
      }
    } catch (error) {
      console.error("Error adding unavailable slot:", error)
      toast({
        title: "Error",
        description: "Failed to add unavailable time slot",
        variant: "destructive",
      })
    }
  }

  // Delete an unavailable slot
  const handleDeleteSlot = (slotId: string, deleteRecurring = false) => {
    if (!user) return

    try {
      const success = deleteUnavailableTimeSlot(user.id, slotId, deleteRecurring)

      if (success) {
        // Refresh the list
        const dateStr = format(selectedDate!, "yyyy-MM-dd")
        const availability = loadUserAvailability(user.id)
        if (availability) {
          const slotsForDate = availability.unavailableSlots.filter((slot) => slot.date === dateStr)
          setUnavailableSlots(slotsForDate)
        }

        toast({
          title: "Time slot deleted",
          description: deleteRecurring
            ? "All recurring instances of this time slot have been deleted"
            : "The time slot has been deleted",
        })
      }
    } catch (error) {
      console.error("Error deleting unavailable slot:", error)
      toast({
        title: "Error",
        description: "Failed to delete unavailable time slot",
        variant: "destructive",
      })
    }
  }

  // Handle recurrence change
  const handleRecurrenceChange = (recurrence: any) => {
    setNewSlotRecurrence(recurrence as RecurrenceRule | undefined)
  }

  // Sort slots by start time
  const sortedSlots = [...unavailableSlots].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime)
  })

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manage Unavailable Time Slots</CardTitle>
            <CardDescription>Specify specific time slots when you're unavailable on specific days</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal mb-4">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} initialFocus />
              </PopoverContent>
            </Popover>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Unavailable Time Slots</h3>
                <Button variant="outline" size="sm" onClick={() => setIsAddingSlot(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Slot
                </Button>
              </div>

              {sortedSlots.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No unavailable time slots for this date</div>
              ) : (
                <ScrollArea className="h-[270px]">
                  <div className="space-y-2">
                    {sortedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-red-50 dark:bg-red-900/20"
                      >
                        <div>
                          <div className="font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-red-500" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {slot.title && <p className="text-sm text-muted-foreground">{slot.title}</p>}
                          {slot.recurring && (
                            <div className="text-xs text-muted-foreground italic mt-1">
                              {slot.recurring.type !== "none" && "Recurring"}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteSlot(slot.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                            {slot.recurring && slot.recurring.type !== "none" && (
                              <DropdownMenuItem onClick={() => handleDeleteSlot(slot.id, true)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete All Recurring
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <div>
            {isAddingSlot ? (
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Add Unavailable Time Slot</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time</Label>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="start-time"
                          type="time"
                          value={newSlotStartTime}
                          onChange={(e) => setNewSlotStartTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time">End Time</Label>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="end-time"
                          type="time"
                          value={newSlotEndTime}
                          onChange={(e) => setNewSlotEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {newSlotStartTime >= newSlotEndTime && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Invalid time range</AlertTitle>
                      <AlertDescription>End time must be after start time</AlertDescription>
                    </Alert>
                  )}

                  <Popover open={titleIsOpen} onOpenChange={setTitleIsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {newSlotTitle ? newSlotTitle : "Add a reason (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Reason for unavailability</h4>
                        <Input
                          placeholder="e.g., Lunch break, Doctor's appointment"
                          value={newSlotTitle}
                          onChange={(e) => setNewSlotTitle(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => setTitleIsOpen(false)}>
                            Done
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Recurrence</h4>
                    <RecurrenceEditor
                      recurrence={newSlotRecurrence}
                      onChange={handleRecurrenceChange}
                      startDate={selectedDate || new Date()}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={() => setIsAddingSlot(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSlot} disabled={newSlotStartTime >= newSlotEndTime}>
                      Add Time Slot
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-xs">
                  <div className="bg-muted h-32 w-32 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Manage Your Time</h3>
                  <p className="text-sm text-muted-foreground">
                    Add specific time slots when you're unavailable for meetings or other activities.
                  </p>
                  <Button variant="default" className="w-full" onClick={() => setIsAddingSlot(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Unavailable Slot
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
