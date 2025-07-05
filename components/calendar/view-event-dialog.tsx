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
import { ApiClient, User } from "@/lib/api-client"

interface ViewEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onEventUpdated: () => void
  onEventDeleted: () => void
}

export function ViewEventDialog({
  open,
  onOpenChange,
  event,
  onEventUpdated,
  onEventDeleted,
}: ViewEventDialogProps) {
  const { user } = useAuth()
  const { toast: useToastToast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [userIdToName, setUserIdToName] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchUsers() {
      const api = new ApiClient()
      const response = await api.getUsers()
      if (response.success && response.data?.users) {
        setUsers(response.data.users)
        const map: Record<string, string> = {}
        response.data.users.forEach(user => {
          map[String(user.id)] = user.name || user.email || `User ${user.id}`
        })
        setUserIdToName(map)
      }
    }
    fetchUsers()
  }, [])

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
    return user && (user.role === "owner" || event?.createdBy === user.id)
  }

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!event) return

    setIsDeleting(true)
    try {
      const success = await deleteCalendarEvent(event.id)
      if (success) {
        useToastToast({
          title: "Success",
          description: "Event deleted successfully",
        })
        onEventDeleted()
        onOpenChange(false)
        setShowDeleteDialog(false)
      } else {
        throw new Error("Failed to delete event")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      useToastToast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{event?.title}</DialogTitle>
          </DialogHeader>

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

            {event.location && (
              <div>
                <h3 className="font-medium mb-1">Location</h3>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-1">Type</h3>
              <Badge variant="secondary">{event.type}</Badge>
            </div>

            {event.attendees && event.attendees.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Attendees</h3>
                <div className="space-y-1">
                  {event.attendees.map((attendeeId) => (
                    <p key={attendeeId} className="text-sm text-muted-foreground">
                      {userIdToName[attendeeId] || attendeeId}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {canModifyEvent() && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
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
          onEventUpdated={() => {
            onEventUpdated()
            onOpenChange(false)
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
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
