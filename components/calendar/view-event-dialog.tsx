"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon, MapPin, AlignLeft, Users, Bell, Repeat, Pencil, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { deleteCalendarEvent } from "@/lib/calendar-utils"
import { EditEventDialog } from "./edit-event-dialog"
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
import type { CalendarEvent } from "@/lib/calendar-utils"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface ViewEventDialogProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

interface EventViewer {
  id: string
  name: string
  email: string
}

interface Event {
  id: string
  title: string
  description: string
  start: string
  end: string
  viewers: EventViewer[]
  createdBy: {
    name: string
    email: string
  }
}

export function ViewEventDialog({
  isOpen,
  onClose,
  eventId,
}: ViewEventDialogProps) {
  const { user } = useAuth()
  const { toast: useToastToast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await api.get(`/calendar/events/${eventId}`)
        setEvent(response.data)
      } catch (error) {
        setError("Failed to load event details")
        useToastToast.error("Failed to load event details")
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchEvent()
    }
  }, [eventId, isOpen, useToastToast])

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPp")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Check if user can edit/delete the event
  const canModifyEvent = () => {
    return user && (user.role === "owner" || event?.createdBy.email === user.email)
  }

  // Handle event deletion
  const handleDeleteEvent = () => {
    try {
      deleteCalendarEvent(event?.id)
      useToastToast({
        title: "Success",
        description: "Event deleted successfully",
      })
      onClose()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting event:", error)
      useToastToast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  // Get event type label
  const getEventTypeLabel = () => {
    switch (event?.type) {
      case "meeting":
        return "Meeting"
      case "personal":
        return "Personal"
      case "holiday":
        return "Holiday"
      default:
        return "Event"
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isLoading ? "Loading..." : error ? "Error" : event?.title}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-6">Loading event details...</div>
          ) : error ? (
            <div className="py-6 text-red-500">{error}</div>
          ) : event ? (
            <div className="py-4 space-y-4">
              <div>
                <h3 className="font-medium mb-1">Time</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(event.start)} - {formatDateTime(event.end)}
                </p>
              </div>

              {event.description && (
                <div>
                  <h3 className="font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-1">Created By</h3>
                <p className="text-sm text-muted-foreground">
                  {event.createdBy.name} ({event.createdBy.email})
                </p>
              </div>

              {event.viewers && event.viewers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-1">Viewers</h3>
                  <div className="space-y-1">
                    {event.viewers.map((viewer) => (
                      <p key={viewer.id} className="text-sm text-muted-foreground">
                        {viewer.name} ({viewer.email})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            {canModifyEvent() && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      {event && (
        <EditEventDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          event={event}
          onEventUpdated={(updatedEvent) => {
            setEvent(updatedEvent)
            onClose()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{event?.title}".
              {event?.isRecurring && " This will delete all instances of this recurring event."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
