"use client"

import { MeetingRequestsList } from "@/components/dashboard/meeting-requests-list"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { ApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { checkUsersAvailability } from "@/lib/availability-utils"
import { addHours } from "date-fns"

// Initialize API client
const api = new ApiClient();

export default function MeetingRequestsPage() {
  const { user, users } = useAuth()
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)

  // Find the owner/CEO to request meetings from
  const owner = users.find(u => u.role === "owner" || u.role === "ceo")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError("You must be logged in to request a meeting")
      return
    }

    if (!owner) {
      setError("Invalid meeting target")
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

    // Check owner's availability (assuming 1-hour meetings)
    const endDateTime = addHours(selectedDateTime, 1)
    const { available, conflicts } = checkUsersAvailability(
      [owner.id.toString()],
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
      const response = await api.createMeetingRequest({
        targetUserId: owner.id.toString(),
        proposedDateTime: selectedDateTime.toISOString(),
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
        {user?.role === "employee" && owner && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Request Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Meeting with {owner.name}</DialogTitle>
                <DialogDescription>
                  Fill out the form below to request a meeting. They will be notified and can approve, schedule, or
                  deny your request. Meetings can only be scheduled during their available hours.
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
