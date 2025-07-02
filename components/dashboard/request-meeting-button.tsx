"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { generateId } from "@/lib/uuid"
import { loadData, saveData } from "@/lib/data-persistence"
import api from "@/lib/api-client"
import { toast } from "sonner"
import { DateTimePicker } from "../ui/date-time-picker"

interface RequestMeetingButtonProps {
  ownerId?: string
  ownerName?: string
  memberId?: string
  disabled?: boolean
  className?: string
}

// Define the MeetingRequest type
interface MeetingRequest {
  id: string
  requesterId: string
  requesterName: string
  ownerId: string
  ownerName: string
  subject: string
  description: string
  preferredDates: string[]
  status: "pending" | "approved" | "scheduled" | "denied"
  createdAt: string
  updatedAt: string
}

export function RequestMeetingButton({
  ownerId,
  ownerName,
  memberId,
  disabled = false,
  className
}: RequestMeetingButtonProps) {
  const { user, users } = useAuth()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)

  // Determine the target user (owner) based on props
  const targetUserId = ownerId || memberId
  let targetUserName = ownerName

  // If memberId is provided, find the user's name
  if (memberId && !ownerName) {
    const targetUser = users.find(u => u.id.toString() === memberId.toString())
    targetUserName = targetUser?.name || "Team Member"
  }

  // Only show for employees
  if (user?.role !== 'employee') {
    return null
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError("You must be logged in to request a meeting")
      return
    }

    if (!targetUserId) {
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

    setIsSubmitting(true)

    try {
      await api.post('/meetings/request', {
        targetUserId,
        proposedDateTime: selectedDateTime.toISOString(),
      })

      setOpen(false)
      toast.success("Meeting request sent successfully")
    } catch (error) {
      console.error("Meeting request error:", error)
      setError("Failed to send meeting request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't show for owners requesting meetings with themselves
  if (user?.id.toString() === targetUserId?.toString()) return null

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            className={`gap-2 ${className || ""}`}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" /> Request Meeting
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Meeting with {targetUserName}</DialogTitle>
            <DialogDescription>
              Fill out the form below to request a meeting. They will be notified and can approve, schedule, or
              deny your request.
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
    </>
  )
}
