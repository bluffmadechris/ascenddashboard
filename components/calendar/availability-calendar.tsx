"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { toast } from "sonner"
import { CalendarMonthView } from "./calendar-month-view"
import { useAuth } from "@/lib/auth-context"
import { Trash2, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Viewer {
  id: string
  name: string
}

interface AvailabilityCalendarProps {
  userId: string
  isEditable?: boolean
  onAvailabilityChange?: (availability: any) => void
}

export function AvailabilityCalendar({
  userId,
  isEditable = false,
  onAvailabilityChange
}: AvailabilityCalendarProps) {
  const { user, users } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availability, setAvailability] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [selectedViewers, setSelectedViewers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDateForDelete, setSelectedDateForDelete] = useState<Date | null>(null)

  // Initialize viewers with team members
  useEffect(() => {
    if (users && user) {
      const teamMembers = users
        .filter(u => u.id !== user.id) // Exclude current user
        .map(u => ({
          id: u.id.toString(),
          name: u.name
        }))
      setViewers(teamMembers)
    }
  }, [users, user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [availabilityRes, eventsRes] = await Promise.all([
          api.getUserAvailability(userId),
          api.getUserEvents(userId)
        ])
        setAvailability(availabilityRes.data || [])
        setEvents(eventsRes.data?.data || [])
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch calendar data:", error)
        toast.error("Failed to fetch calendar data")
        setIsLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const handleDateSelect = async (date: Date, deleteMode = false) => {
    if (!isEditable) return

    const dateStr = format(date, "yyyy-MM-dd")
    const existingAvailability = availability.find(a =>
      format(parseISO(a.date), "yyyy-MM-dd") === dateStr
    )

    try {
      if (deleteMode) {
        // Delete availability entry entirely
        if (existingAvailability) {
          await api.deleteAvailabilityEntry(userId, existingAvailability.id.toString())
          setAvailability(prev => prev.filter(a =>
            format(parseISO(a.date), "yyyy-MM-dd") !== dateStr
          ))
          toast.success("Availability entry deleted")
        }
      } else {
        // Toggle availability
        const newAvailability = {
          date: dateStr,
          isAvailable: !existingAvailability?.is_available,
          startTime: "09:00",
          endTime: "17:00"
        }

        if (existingAvailability) {
          // Update existing
          await api.updateAvailabilityEntry(userId, existingAvailability.id.toString(), {
            isAvailable: newAvailability.isAvailable
          })
        } else {
          // Create new
          await api.createAvailabilityEntry(userId, newAvailability)
        }

        // Reload availability data
        const response = await api.getUserAvailability(userId)
        if (response.success && response.data) {
          setAvailability(response.data)
        }

        toast.success("Availability updated")
      }

      if (onAvailabilityChange) {
        onAvailabilityChange(availability)
      }
    } catch (error) {
      console.error("Failed to update availability:", error)
      toast.error("Failed to update availability")
    }
  }

  const handleViewerChange = async (viewerId: string) => {
    try {
      if (selectedViewers.includes(viewerId)) {
        // Remove viewer
        setSelectedViewers(prev => prev.filter(id => id !== viewerId))
        // Remove their events from display
        setEvents(prev => prev.filter(event => event.created_by !== viewerId))
      } else {
        // Add viewer
        setSelectedViewers(prev => [...prev, viewerId])
        // Fetch viewer's availability and events
        const [viewerAvailability, viewerEvents] = await Promise.all([
          api.getUserAvailability(viewerId),
          api.getUserEvents(viewerId)
        ])

        // Add viewer's data to display (with different styling)
        if (viewerEvents.success && viewerEvents.data?.data) {
          setEvents(prev => [...prev, ...viewerEvents.data.data.map(event => ({
            ...event,
            isViewer: true,
            viewerName: viewers.find(v => v.id === viewerId)?.name || 'Unknown'
          }))])
        }
      }
    } catch (error) {
      console.error("Failed to fetch viewer data:", error)
      toast.error("Failed to load team member's calendar")
    }
  }

  const openDeleteDialog = (date: Date) => {
    setSelectedDateForDelete(date)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedDateForDelete) {
      handleDateSelect(selectedDateForDelete, true)
    }
    setShowDeleteDialog(false)
    setSelectedDateForDelete(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>
              Availability Calendar
              {userId !== user?.id.toString() && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Viewing {users.find(u => u.id.toString() === userId)?.name || 'Unknown'}'s calendar)
                </span>
              )}
            </CardTitle>
            {isEditable && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Click to toggle • Right-click to delete</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Team Member Selector for viewing others' calendars */}
          {viewers.length > 0 && user?.role === "owner" && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">View Team Members' Availability</Label>
              <div className="flex flex-wrap gap-2">
                {viewers.map(viewer => (
                  <Button
                    key={viewer.id}
                    variant={selectedViewers.includes(viewer.id) ? "default" : "outline"}
                    onClick={() => handleViewerChange(viewer.id)}
                    className="text-sm"
                    size="sm"
                  >
                    {selectedViewers.includes(viewer.id) ? (
                      <Eye className="h-3 w-3 mr-1" />
                    ) : (
                      <EyeOff className="h-3 w-3 mr-1" />
                    )}
                    {viewer.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mb-4 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Events</span>
            </div>
            {selectedViewers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 opacity-70" />
                <span className="text-sm">Team Events</span>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="border rounded-lg overflow-hidden">
            <CalendarMonthView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onDateRightClick={isEditable ? openDeleteDialog : undefined}
              events={events}
              availability={availability}
            />
          </div>

          {/* Quick Actions for Editable Mode */}
          {isEditable && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Tip: Right-click on dates to delete availability entries
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setAvailability([])
                  toast.success("All availability cleared")
                }}
                className="text-sm"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Availability Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the availability entry for {selectedDateForDelete ? format(selectedDateForDelete, "PPP") : ""}?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
