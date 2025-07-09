"use client"

import { MeetingRequestsList } from "@/components/dashboard/meeting-requests-list"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { checkUsersAvailability } from "@/lib/availability-utils"
import { addHours } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MeetingRequestsPage() {
  const { user, users, isApiConnected, refreshUsers } = useAuth()
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)
  const [targetUserId, setTargetUserId] = useState<string>("")
  const isOwner = user?.role === "owner"
  const canRequestMeeting = user && (user.role === "employee" || user.role === "owner")

  // Find the owner/CEO to request meetings from
  const owner = users.find(u => u.role === "owner" || u.role === "ceo")

  // Debug logging
  console.log('Current user:', user)
  console.log('All users:', users)
  console.log('Is owner:', isOwner)
  console.log('API connected:', isApiConnected)

  const filteredUsers = users.filter(u => {
    // Don't include current user
    if (String(u.id) === String(user?.id)) return false;

    // If current user is owner, they can request meetings with anyone except other owners
    if (isOwner) {
      return u.role !== "owner";
    }

    // If current user is employee, they can only request meetings with owners
    return u.role === "owner";
  })

  console.log('Filtered users:', filteredUsers)

  // Ensure users are loaded when component mounts
  useEffect(() => {
    if (isApiConnected && users.length === 0) {
      console.log('Refreshing users on mount...')
      refreshUsers()
    }
  }, [isApiConnected, users.length, refreshUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError("You must be logged in to request a meeting")
      return
    }

    let targetId = targetUserId
    if (!targetId) {
      setError("Please select a user to request a meeting with.")
      return
    }

    if (!subject.trim()) {
      setError("Meeting subject is required")
      return
    }

    if (!selectedDateTime) {
      toast.error("Please select a date and time")
      return
    }

    // Check target user's availability (assuming 1-hour meetings)
    const endDateTime = addHours(selectedDateTime, 1)
    const { available, conflicts } = checkUsersAvailability(
      [String(targetId)],
      selectedDateTime,
      endDateTime,
      users
    )

    if (!available && conflicts.length > 0) {
      setError(conflicts[0].reason)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiClient.createMeetingRequest({
        target_user_id: targetId,
        proposed_date: selectedDateTime.toISOString(),
        subject: subject.trim(),
        description: description.trim()
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to create meeting request')
      }

      // Clear form
      setSubject("")
      setDescription("")
      setSelectedDateTime(null)
      setTargetUserId("")

      // Close dialog
      setShowRequestDialog(false)

      toast.success("Meeting request sent successfully")
    } catch (error) {
      console.error("Meeting request error:", error)
      setError(error instanceof Error ? error.message : "Failed to send meeting request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Meeting Requests</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Manual refresh triggered')
              refreshUsers()
            }}
          >
            Refresh Users ({users.length})
          </Button>
        </div>
        {canRequestMeeting && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Request Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Meeting{isOwner ? " with a Team Member" : owner ? ` with ${owner.name}` : ""}</DialogTitle>
                <DialogDescription>
                  Fill out the form below to request a meeting. The recipient will be notified and can approve, schedule, or deny your request.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUser">Select User *</Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Debug: Users loaded: {users.length}, Filtered: {filteredUsers.length}, Role: {user?.role}
                  </div>
                  <Select value={targetUserId} onValueChange={(value) => {
                    console.log('User selected:', value)
                    setTargetUserId(value)
                  }} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name} ({u.role})
                          </SelectItem>
                        ))
                      ) : (
                        <div>
                          <SelectItem disabled value="no-users">
                            {users.length === 0 ? "Loading users..." : "No users available for meeting requests"}
                          </SelectItem>
                          {users.length > 0 && (
                            <SelectItem disabled value="debug-info">
                              Debug: Found {users.length} users, your role: {user?.role}
                            </SelectItem>
                          )}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {targetUserId && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {users.find(u => String(u.id) === targetUserId)?.name}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Force refresh users...')
                      refreshUsers()
                    }}
                  >
                    Refresh Users
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Meeting Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of meeting purpose"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context or agenda items"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date & Time *</Label>
                  <DateTimePicker
                    date={selectedDateTime ?? undefined}
                    setDate={(d) => setSelectedDateTime(d ?? null)}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Request"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <MeetingRequestsList />
    </div>
  )
}
