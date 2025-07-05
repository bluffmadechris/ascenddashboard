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
import { Tabs as UITabs, TabsList as UITabsList, TabsTrigger as UITabsTrigger, TabsContent as UITabsContent } from "@/components/ui/tabs"
import { CalendarIcon, Check, Clock, X, Trash2, CalendarPlus, AlertCircle } from "lucide-react"
import { format, parseISO, isValid, addHours, isBefore, isSameDay } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import {
  type MeetingRequest,
  type MeetingRequestStatus,
  getMeetingRequestsForUser,
  updateMeetingRequest,
  deleteMeetingRequest,
  checkSchedulingConflicts,
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
  const [activeTab, setActiveTab] = useState<string>(user?.role === "owner" ? "received" : "sent")
  const [statusTab, setStatusTab] = useState<MeetingRequestStatus | "all">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictDetected, setConflictDetected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load meeting requests based on activeTab (sent/received)
  useEffect(() => {
    if (!user) return
    const fetchRequests = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const type = activeTab === "received" ? "owner" : "requester"
        const userRequests = await getMeetingRequestsForUser(user.id, type)
        setRequests(userRequests)
      } catch (error) {
        setError("Failed to load meeting requests. Please try again.")
        console.error("Error loading meeting requests:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRequests()
  }, [user, activeTab])

  // Filter requests based on statusTab
  const filteredRequests = statusTab === "all" ? requests : requests.filter((request) => request.status === statusTab)

  // Group requests by status for counts
  const requestCounts = requests.reduce(
    (acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1
      return acc
    },
    {} as Record<MeetingRequestStatus, number>,
  )

  // Check if user can manage requests
  const canManageRequests = user?.role === "owner"

  // Handle responding to a request
  const handleRespond = (request: MeetingRequest, status: MeetingRequestStatus) => {
    if (!canManageRequests) {
      toast({
        title: "Permission Denied",
        description: "Only owners can manage meeting requests.",
        variant: "destructive",
      })
      return
    }
    setSelectedRequest(request)
    setResponseMessage("")
    setScheduledDate(undefined)
    setResponseDialogOpen(true)
  }

  // Handle deleting a request
  const handleDelete = (request: MeetingRequest) => {
    if (!canManageRequests) {
      toast({
        title: "Permission Denied",
        description: "Only owners can delete meeting requests.",
        variant: "destructive",
      })
      return
    }
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
  const checkForConflicts = async (date: Date): Promise<boolean> => {
    if (!selectedRequest || !user) return false
    return checkSchedulingConflicts(user.id, date.toISOString(), 60, selectedRequest.id)
  }

  // Submit response
  const submitResponse = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)

    try {
      const updates: Partial<MeetingRequest> = {
        status: "approved",
        responseMessage,
      }

      const updatedRequest = await updateMeetingRequest(selectedRequest.id, updates)

      if (updatedRequest) {
        // Update local state
        setRequests((prev) => prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)))

        // Show success message
        toast({
          title: "Response Sent",
          description: `You have ${updates.status} the meeting request from ${selectedRequest.requesterName}`,
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
    if (await checkForConflicts(scheduledDate)) {
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

      const updatedRequest = await updateMeetingRequest(selectedRequest.id, updates)

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
      const success = await deleteMeetingRequest(selectedRequest.id)

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
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No date provided"
    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return "Invalid date"
      return format(date, "PPP 'at' p") // e.g. "April 29, 2024 at 2:00 PM"
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Get status badge
  const getStatusBadge = (status: MeetingRequestStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "approved":
        return <Badge variant="success">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return null
    }
  }

  // Render empty state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground">Loading meeting requests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  // Always render the tabs, even if there are no requests
  return (
    <div>
      <UITabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <UITabsList>
          <UITabsTrigger value="received">Received</UITabsTrigger>
          <UITabsTrigger value="sent">Sent</UITabsTrigger>
        </UITabsList>
      </UITabs>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Meeting Requests</h2>
          {canManageRequests && (
            <Button onClick={() => window.location.href = "/schedule-meeting"}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Request Meeting
            </Button>
          )}
        </div>

        <UITabs value={statusTab} onValueChange={(value) => setStatusTab(value as MeetingRequestStatus | "all")}>
          <UITabsList>
            <UITabsTrigger value="all">
              All <Badge variant="secondary" className="ml-2">{requests.length}</Badge>
            </UITabsTrigger>
            <UITabsTrigger value="pending">
              Pending <Badge variant="secondary" className="ml-2">{requestCounts.pending || 0}</Badge>
            </UITabsTrigger>
            <UITabsTrigger value="approved">
              Approved <Badge variant="secondary" className="ml-2">{requestCounts.approved || 0}</Badge>
            </UITabsTrigger>
            <UITabsTrigger value="rejected">
              Rejected <Badge variant="secondary" className="ml-2">{requestCounts.rejected || 0}</Badge>
            </UITabsTrigger>
            <UITabsTrigger value="cancelled">
              Cancelled <Badge variant="secondary" className="ml-2">{requestCounts.cancelled || 0}</Badge>
            </UITabsTrigger>
          </UITabsList>

          <UITabsContent value={statusTab} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <CalendarPlus className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No meeting requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{request.subject}</CardTitle>
                        <CardDescription>
                          Requested from {request.requesterName || "Unknown"}
                        </CardDescription>
                      </div>
                      <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "success" : "destructive"}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {request.description && (
                      <div>
                        <Label>Details:</Label>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                    )}
                    <div>
                      <Label>Proposed Date & Time:</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(request.proposedDateTime)}</p>
                    </div>
                    <div>
                      <Label>Requested on:</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</p>
                    </div>
                    {request.responseMessage && (
                      <div>
                        <Label>Response:</Label>
                        <p className="text-sm text-muted-foreground">{request.responseMessage}</p>
                      </div>
                    )}
                  </CardContent>
                  {canManageRequests && (
                    <CardFooter className="flex justify-end space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="default"
                            onClick={() => handleRespond(request, "approved")}
                            disabled={isSubmitting}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRespond(request, "rejected")}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {(request.status === "pending" || request.status === "approved") && (
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(request)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </UITabsContent>
        </UITabs>

        {/* Response Dialog */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Meeting Request</DialogTitle>
              <DialogDescription>
                {selectedRequest?.status === "approved"
                  ? "Approve this meeting request and send a response to the requester."
                  : "Reject this meeting request and provide a reason to the requester."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Response Message (Optional)</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Enter your response..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResponseDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={submitResponse} disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Response"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meeting Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this meeting request? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitDelete} disabled={isSubmitting}>
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
