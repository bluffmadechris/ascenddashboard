"use client"

import { useState } from "react"
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

interface ViewEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onEventUpdated: () => void
  onEventDeleted: () => void
}

export function ViewEventDialog({ open, onOpenChange, event, onEventUpdated, onEventDeleted }: ViewEventDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Format date and time
  const formatDateTime = (isoString: string) => {
    try {
      const date = parseISO(isoString)
      return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Check if user can edit/delete the event
  const canModifyEvent = () => {
    return user && (user.role === "owner" || event.createdBy === user.id)
  }

  // Handle event deletion
  const handleDeleteEvent = () => {
    try {
      deleteCalendarEvent(event.id)
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
      onEventDeleted()
      setShowDeleteDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  // Get event type label
  const getEventTypeLabel = () => {
    switch (event.type) {
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
      <Dialog open={open && !showEditDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">{event.title}</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <div>{formatDateTime(event.start)}</div>
                <div>{formatDateTime(event.end)}</div>
                {event.isRecurring && (
                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                    <Repeat className="h-3 w-3 mr-1" />
                    Recurring event
                  </div>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>{event.location}</div>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3">
                <AlignLeft className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="whitespace-pre-wrap">{event.description}</div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <div>Organizer: {event.createdBy}</div>
                {event.assignedTo && event.assignedTo.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Participants:</div>
                    <div className="flex flex-wrap gap-1">
                      {event.assignedTo.map((id) => (
                        <Badge key={id} variant="outline">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {event.reminders && event.reminders.length > 0 && (
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground mb-1">Reminders:</div>
                  <div className="flex flex-wrap gap-1">
                    {event.reminders.map((reminder) => (
                      <Badge key={reminder.id} variant="outline">
                        {reminder.time} {reminder.unit} before ({reminder.type})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Badge style={{ backgroundColor: event.color }} className="text-white">
                {getEventTypeLabel()}
              </Badge>
            </div>
          </div>

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
              This will permanently delete the event "{event.title}".
              {event.isRecurring && " This will delete all instances of this recurring event."}
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
