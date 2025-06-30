"use client"

import { useState, useEffect } from "react"
import { isValid, isBefore, addHours } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { createCalendarEvent } from "@/lib/calendar-utils"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { simulateSendMeetingInvitation } from "@/lib/email-service"
import { loadData, saveData } from "@/lib/data-persistence"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface ScheduleEmployeeMeetingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onMeetingScheduled: () => void
}

export function ScheduleEmployeeMeeting({
  open,
  onOpenChange,
  selectedDate,
  onMeetingScheduled,
}: ScheduleEmployeeMeetingProps) {
  const { user, users } = useAuth()
  const { toast } = useToast()

  // Meeting form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [sendNotifications, setSendNotifications] = useState(true)
  const [isRequired, setIsRequired] = useState(true)
  const [dateError, setDateError] = useState<string | null>(null)

  // Reset form when dialog opens or selected date changes
  useEffect(() => {
    if (open) {
      // Initialize dates only once when the dialog opens
      const now = new Date()
      const initialDate = selectedDate && isValid(selectedDate) ? new Date(selectedDate) : now

      // Set initial start date
      setStartDate(initialDate)
      setStartTime(
        initialDate.getHours().toString().padStart(2, "0") + ":" + initialDate.getMinutes().toString().padStart(2, "0"),
      )

      // Set initial end date (1 hour after start)
      const initialEndDate = addHours(initialDate, 1)
      setEndDate(initialEndDate)
      setEndTime(
        initialEndDate.getHours().toString().padStart(2, "0") +
          ":" +
          initialEndDate.getMinutes().toString().padStart(2, "0"),
      )

      // Reset other form fields
      setTitle("")
      setDescription("")
      setLocation("")
      setSelectedEmployees([])
      setPriority("medium")
      setSendNotifications(true)
      setIsRequired(true)
      setDateError(null)
    }
  }, [open, selectedDate])

  // Validate dates whenever they change
  useEffect(() => {
    validateDates()
  }, [startDate, endDate, startTime, endTime])

  // Function to validate dates
  const validateDates = () => {
    setDateError(null)

    if (!startDate || !endDate || !startTime || !endTime) return true

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
    if (!startDate || !startTime) return null

    const date = new Date(startDate)
    const [hours, minutes] = startTime.split(":").map(Number)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  // Get end date and time as Date object
  const getEndDateTime = () => {
    if (!endDate || !endTime) return null

    const date = new Date(endDate)
    const [hours, minutes] = endTime.split(":").map(Number)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  // Filter employees (exclude the current user if they're an owner)
  const employees = users.filter((u) => u.id !== user?.id && u.role !== "owner")

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  // Toggle employee selection
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    )
  }

  // Select all employees
  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map((emp) => emp.id))
  }

  // Deselect all employees
  const deselectAllEmployees = () => {
    setSelectedEmployees([])
  }

  // Add date selection UI
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    // If end date is not set or is before the new start date, update it
    if (!endDate || (date && endDate && isBefore(endDate, date))) {
      setEndDate(date ? addHours(date, 1) : undefined)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
  }

  // Handle form submission
  const handleScheduleMeeting = async () => {
    if (!user) return

    try {
      // Validate form
      if (!title.trim()) {
        toast({
          title: "Error",
          description: "Please enter a meeting title",
          variant: "destructive",
        })
        return
      }

      if (selectedEmployees.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one employee",
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

      // Create calendar event
      const newEvent = {
        title,
        description,
        start: start.toISOString(),
        end: end.toISOString(),
        location,
        type: "meeting" as const,
        status: "confirmed" as const,
        createdBy: user.id,
        attendees: [user.id, ...selectedEmployees], // Use attendees property
        assignedTo: [user.id, ...selectedEmployees], // Keep assignedTo for backward compatibility
        color: "#3b82f6", // Blue
        priority,
        isRequired,
      }

      const createdEvent = createCalendarEvent(newEvent)

      // Create news item for each employee
      const newsItems = loadData("news-items", []) || []

      selectedEmployees.forEach((employeeId) => {
        const employee = users.find((u) => u.id === employeeId)
        if (!employee) return

        const newsItem = {
          id: `meeting-${createdEvent.id}-${employeeId}`,
          type: "meeting",
          title: `New Meeting: ${title}`,
          description: description || "No description provided",
          date: new Date().toISOString(),
          priority,
          status: "pending",
          link: "/calendar",
          relatedTo: title,
          forUser: employeeId,
          eventId: createdEvent.id,
          read: false,
        }

        newsItems.push(newsItem)
      })

      saveData("news-items", newsItems)

      // Send notifications if enabled
      if (sendNotifications) {
        // Get participant details
        const participants = selectedEmployees.map((employeeId) => {
          const employeeDetails = users.find((u) => u.id === employeeId)
          return {
            id: employeeId,
            name: employeeDetails?.name || "Unknown User",
            email: employeeDetails?.email || "unknown@example.com",
          }
        })

        // Get organizer details
        const organizer = {
          name: user.name,
          email: user.email,
        }

        // Send meeting invitations
        simulateSendMeetingInvitation(
          {
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            description,
            location,
          },
          participants,
          organizer,
        )

        toast({
          title: "Notifications Sent",
          description: `Meeting invitations sent to ${participants.length} employees`,
        })
      }

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      })

      onMeetingScheduled()
      onOpenChange(false)
    } catch (error) {
      console.error("Error scheduling meeting:", error)
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-4 sticky top-0 bg-background z-10 border-b">
          <DialogTitle className="text-2xl font-bold">Schedule Employee Meeting</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-grow px-8 py-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-medium">
                Meeting Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meeting title"
                className="h-12 text-base"
              />
            </div>

            <div className="grid gap-2">
              <Label>Date and Time</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="grid gap-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect}
                        disabled={(date) => startDate ? isBefore(date, startDate) : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="grid gap-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {dateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{dateError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="location" className="text-base font-medium">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter the exact meeting location"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter meeting description"
                className="min-h-[120px] text-base p-4"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select priority">
                    <div className="flex items-center">
                      <Badge variant={getPriorityColor(priority)} className="mr-2">
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Badge>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        Low
                      </Badge>
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center">
                      <Badge variant="default" className="mr-2">
                        Medium
                      </Badge>
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center">
                      <Badge variant="destructive" className="mr-2">
                        High
                      </Badge>
                      High Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Employees</Label>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" onClick={selectAllEmployees} type="button">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllEmployees} type="button">
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                {employees.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">No employees found</div>
                ) : (
                  <div className="space-y-3">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                          className="h-5 w-5"
                        />
                        <Label htmlFor={`employee-${employee.id}`} className="cursor-pointer text-base">
                          {employee.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-3">
                <Switch id="required" checked={isRequired} onCheckedChange={setIsRequired} className="scale-125" />
                <Label htmlFor="required" className="text-base">
                  Attendance is required
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="notifications"
                  checked={sendNotifications}
                  onCheckedChange={setSendNotifications}
                  className="scale-125"
                />
                <Label htmlFor="notifications" className="text-base">
                  Send email notifications
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 border-t sticky bottom-0 bg-background z-10">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button" className="h-12 px-6 text-base">
            Cancel
          </Button>
          <Button
            onClick={handleScheduleMeeting}
            disabled={!!dateError || !title.trim() || selectedEmployees.length === 0}
            type="button"
            className="h-12 px-6 text-base"
          >
            Schedule Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
