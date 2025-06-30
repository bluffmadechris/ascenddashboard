"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Check, Clock, X, Trash2, CalendarPlus2Icon as CalendarIcon2, AlertCircle } from "lucide-react"
import { format, parseISO, isValid, addHours, isBefore, isSameDay } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import {
  type MeetingRequest,
  type MeetingRequestStatus,
  getMeetingRequestsForUser,
  updateMeetingRequest,
  deleteMeetingRequest,
} from "@/lib/meeting-request"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function MeetingRequestsList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MeetingRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MeetingRequestStatus | "all">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictDetected, setConflictDetected] = useState(false)

  // Load meeting requests
  useEffect(() => {
    if (!user) return

    const userRequests = getMeetingRequestsForUser(user.id, user.role === "owner" ? "owner" : "requester")
    setRequests(userRequests)
  }, [user])

  // Filter requests based on active tab
  const filteredRequests = activeTab === "all" ? requests : requests.filter((request) => request.status === activeTab)

  // Group requests by status for counts
  const requestCounts = requests.reduce(
    (acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1
      return acc
    },
    {} as Record<MeetingRequestStatus, number>,
  )

  // Handle responding to a request
  const handleRespond = (request: MeetingRequest, status: MeetingRequestStatus) => {
    setSelectedRequest(request)
    setResponseMessage("")
    setScheduledDate(undefined)
    setResponseDialogOpen(true)
  }

  // Handle deleting a request
  const handleDelete = (request: MeetingRequest) => {
    setSelectedRequest(request)
    setDeleteDialogOpen(true)
  }

  // Handle rescheduling a request
  const handleReschedule = (request: MeetingRequest) => {
    setSelectedRequest(request)
    // Initialize with current scheduled date if available
    if (request.scheduledDate) {
      setScheduledDate(parseISO(request.scheduledDate))
    } else {
      setScheduledDate(undefined)
    }
    setResponseMessage("")
    setRescheduleDialogOpen(true)
    setConflictDetected(false)
  }

  // Check for scheduling conflicts
  const checkForConflicts = (date: Date): boolean => {
    // This is a simplified conflict check - in a real app, you would check against
    // a calendar database or availability service
    const conflictingMeetings = requests.filter((req) => {
      if (req.id === selectedRequest?.id || !req.scheduledDate) return false

      const meetingDate = parseISO(req.scheduledDate)
      const meetingEnd = addHours(meetingDate, 1) // Assuming 1 hour meetings

      // Check if the new date falls within any existing meeting
      return (
        (date >= meetingDate && date < meetingEnd) ||
        (addHours(date, 1) > meetingDate && addHours(date, 1) <= meetingEnd)
      )
    })

    return conflictingMeetings.length > 0
  }

  // Submit response
  const submitResponse = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)

    try {
      const status = scheduledDate ? "scheduled" : selectedRequest.status
      const updates: Partial<MeetingRequest> = {
        status,
        responseMessage,
      }

      if (scheduledDate) {
        updates.scheduledDate = scheduledDate.toISOString()
      }

      const updatedRequest = updateMeetingRequest(selectedRequest.id, updates)

      if (updatedRequest) {
        // Update local state
        setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)))

        // Show success message
        toast({
          title: "Response Sent",
          description: `You have ${status} the meeting request from ${selectedRequest.requesterName}`,
        })

        // Close dialog
        setResponseDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to meeting request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit reschedule
  const submitReschedule = async () => {
    if (!selectedRequest || !scheduledDate) return

    // Check for conflicts
    if (checkForConflicts(scheduledDate)) {
      setConflictDetected(true)
      return
    }

    setIsSubmitting(true)

    try {
      const updates: Partial<MeetingRequest> = {
        status: "scheduled",
        scheduledDate: scheduledDate.toISOString(),
        responseMessage: responseMessage || `Meeting rescheduled to ${format(scheduledDate, "PPP p")}`,
      }

      const updatedRequest = updateMeetingRequest(selectedRequest.id, updates)

      if (updatedRequest) {
        // Update local state
        setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)))

        // Show success message
        toast({
          title: "Meeting Rescheduled",
          description: `The meeting with ${selectedRequest.requesterName} has been rescheduled.`,
        })

        // Close dialog
        setRescheduleDialogOpen(false)
        setConflictDetected(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reschedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit delete
  const submitDelete = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)

    try {
      const success = deleteMeetingRequest(selectedRequest.id)

      if (success) {
        // Update local state
        setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id))

        // Show success message
        toast({
          title: "Meeting Deleted",
          description: `The meeting with ${selectedRequest.requesterName} has been deleted.`,
        })

        // Close dialog
        setDeleteDialogOpen(false)
      } else {
        throw new Error("Failed to delete meeting request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meeting request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, "MMM d, yyyy h:mm a") : "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  // Get status badge
  const getStatusBadge = (status: MeetingRequestStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Scheduled
          </Badge>
        )
      case "denied":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Denied
          </Badge>
        )
    }
  }

  // Only show for users
  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meeting Requests</h2>
        <p className="text-muted-foreground">
          {user.role === "owner"
            ? "View and respond to meeting requests from team members."
            : "View your meeting requests and their status."}
        </p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {requests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-2">
              {requestCounts.pending || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            <Badge variant="secondary" className="ml-2">
              {requestCounts.approved || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled
            <Badge variant="secondary" className="ml-2">
              {requestCounts.scheduled || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="denied">
            Denied
            <Badge variant="secondary" className="ml-2">
              {requestCounts.denied || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.subject}</CardTitle>
                        <CardDescription>
                          {user.role === "owner"
                            ? `Requested by ${request.requesterName}`
                            : `Requested from ${request.ownerName}`}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {request.description && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Details:</h4>
                        <p className="text-sm">{request.description}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Preferred Dates:</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.preferredDates.map((date) => (
                          <Badge key={date} variant="secondary">
                            {formatDate(date)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {request.scheduledDate && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Scheduled For:</h4>
                        <Badge variant="default" className="bg-blue-500">
                          {formatDate(request.scheduledDate)}
                        </Badge>
                      </div>
                    )}

                    {request.responseMessage && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Response:</h4>
                        <p className="text-sm">{request.responseMessage}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">Requested on {formatDate(request.createdAt)}</div>
                  </CardContent>

                  {user.role === "owner" && (
                    <CardFooter className="flex justify-end space-x-2">
                      {/* Show different buttons based on status */}
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => {
                              setSelectedRequest({ ...request, status: "denied" })
                              setResponseDialogOpen(true)
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Deny
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={() => {
                              setSelectedRequest({ ...request, status: "approved" })
                              setResponseDialogOpen(true)
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest({ ...request, status: "scheduled" })
                              setResponseDialogOpen(true)
                            }}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Schedule
                          </Button>
                        </>
                      )}

                      {/* For approved or scheduled meetings, show reschedule and delete options */}
                      {(request.status === "approved" || request.status === "scheduled") && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => handleDelete(request)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            onClick={() => handleReschedule(request)}
                          >
                            <CalendarIcon2 className="mr-2 h-4 w-4" />
                            Reschedule
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No meeting requests</h3>
              <p className="mt-2 text-muted-foreground">
                {activeTab === "all"
                  ? "You don't have any meeting requests yet."
                  : `You don't have any ${activeTab} meeting requests.`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === "denied"
                ? "Deny Meeting Request"
                : selectedRequest?.status === "approved"
                  ? "Approve Meeting Request"
                  : "Schedule Meeting"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.status === "denied"
                ? "Provide a reason for denying this meeting request."
                : selectedRequest?.status === "approved"
                  ? "Approve this meeting request and provide any additional information."
                  : "Schedule this meeting and provide details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest?.status === "scheduled" && (
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Meeting Date & Time *</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button id="scheduledDate" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP p") : "Select date and time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={(date) => {
                        if (date) {
                          // Set time to noon by default
                          const newDate = new Date(date)
                          newDate.setHours(12, 0, 0, 0)
                          setScheduledDate(newDate)

                          // Close calendar after selection
                          setCalendarOpen(false)

                          // Focus time input
                          setTimeout(() => {
                            document.getElementById("scheduledTime")?.focus()
                          }, 100)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {scheduledDate && (
                  <div className="mt-2">
                    <Label htmlFor="scheduledTime">Time</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={scheduledDate ? format(scheduledDate, "HH:mm") : ""}
                      onChange={(e) => {
                        if (scheduledDate && e.target.value) {
                          const [hours, minutes] = e.target.value.split(":").map(Number)
                          const newDate = new Date(scheduledDate)
                          newDate.setHours(hours, minutes)
                          setScheduledDate(newDate)
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="responseMessage">Message</Label>
              <Textarea
                id="responseMessage"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder={
                  selectedRequest?.status === "denied"
                    ? "Provide a reason for denying this request..."
                    : selectedRequest?.status === "approved"
                      ? "Add any additional information..."
                      : "Add meeting details, agenda, or instructions..."
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitResponse}
              disabled={isSubmitting || (selectedRequest?.status === "scheduled" && !scheduledDate)}
              className={
                selectedRequest?.status === "denied"
                  ? "bg-red-600 hover:bg-red-700"
                  : selectedRequest?.status === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
              }
            >
              {isSubmitting
                ? "Sending..."
                : selectedRequest?.status === "denied"
                  ? "Deny Request"
                  : selectedRequest?.status === "approved"
                    ? "Approve Request"
                    : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={rescheduleDialogOpen}
        onOpenChange={(open) => {
          setRescheduleDialogOpen(open)
          if (!open) setConflictDetected(false)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
            <DialogDescription>Select a new date and time for this meeting.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rescheduledDate">New Meeting Date & Time *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button id="rescheduledDate" variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP p") : "Select date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      if (date) {
                        // Keep current time if available
                        const newDate = new Date(date)
                        if (scheduledDate) {
                          newDate.setHours(scheduledDate.getHours(), scheduledDate.getMinutes(), 0, 0)
                        } else {
                          newDate.setHours(12, 0, 0, 0)
                        }
                        setScheduledDate(newDate)
                        setConflictDetected(false)

                        // Close calendar after selection
                        setCalendarOpen(false)

                        // Focus time input
                        setTimeout(() => {
                          document.getElementById("rescheduledTime")?.focus()
                        }, 100)
                      }
                    }}
                    disabled={(date) => isBefore(date, new Date()) && !isSameDay(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {scheduledDate && (
                <div className="mt-2">
                  <Label htmlFor="rescheduledTime">Time</Label>
                  <Input
                    id="rescheduledTime"
                    type="time"
                    value={scheduledDate ? format(scheduledDate, "HH:mm") : ""}
                    onChange={(e) => {
                      if (scheduledDate && e.target.value) {
                        const [hours, minutes] = e.target.value.split(":").map(Number)
                        const newDate = new Date(scheduledDate)
                        newDate.setHours(hours, minutes)
                        setScheduledDate(newDate)
                        setConflictDetected(false)
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {conflictDetected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Scheduling Conflict Detected</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The selected time conflicts with another scheduled meeting. Please select a different time.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rescheduleMessage">Message (Optional)</Label>
              <Textarea
                id="rescheduleMessage"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Add a message about why the meeting is being rescheduled..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false)
                setConflictDetected(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReschedule}
              disabled={isSubmitting || !scheduledDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Rescheduling..." : "Reschedule Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting request? This action cannot be undone.
              {selectedRequest?.status === "scheduled" && (
                <div className="mt-2 font-medium text-red-600">
                  This will cancel the scheduled meeting on{" "}
                  {selectedRequest.scheduledDate ? formatDate(selectedRequest.scheduledDate) : "the scheduled date"}.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Deleting..." : "Delete Meeting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
