"use client"

import { useState } from "react"
import { isBefore, addHours } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createCalendarEvent } from "@/lib/calendar-utils"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UserAvailabilitySelector } from "./user-availability-selector"
import { UserAvailabilityDisplay } from "./user-availability-display"
import { checkUsersAvailability } from "@/lib/availability-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"

// Define the form schema
const meetingFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    location: z.string().optional(),
    description: z.string().optional(),
    attendees: z.array(z.string()).optional(),
  })
  .refine((data) => isBefore(data.startDate, data.endDate), {
    message: "End time must be after start time",
    path: ["endDate"],
  })

type MeetingFormValues = z.infer<typeof meetingFormSchema>

interface ScheduleMeetingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialDate?: Date
}

export function ScheduleMeetingForm({ onSuccess, onCancel, initialDate }: ScheduleMeetingFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [availabilityConflicts, setAvailabilityConflicts] = useState<any[]>([])
  const [overrideAvailability, setOverrideAvailability] = useState(false)

  // Set default values
  const defaultValues: Partial<MeetingFormValues> = {
    title: "",
    startDate: initialDate || new Date(),
    endDate: initialDate ? addHours(initialDate, 1) : addHours(new Date(), 1),
    location: "",
    description: "",
    attendees: [],
  }

  // Initialize form
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues,
  })

  // Watch for changes to check availability
  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")

  // Check availability when attendees or dates change
  const checkAvailability = async () => {
    if (!startDate || !endDate || selectedAttendees.length === 0) {
      setAvailabilityConflicts([])
      return
    }

    const { conflicts } = checkUsersAvailability(selectedAttendees, startDate, endDate)
    setAvailabilityConflicts(conflicts)
  }

  // Handle form submission
  const onSubmit = async (data: MeetingFormValues) => {
    if (!user) return

    try {
      setIsSubmitting(true)

      // Check for availability conflicts
      if (availabilityConflicts.length > 0 && !overrideAvailability) {
        toast({
          title: "Availability Conflict",
          description: "One or more attendees are unavailable during this time. Please check availability or override.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create the event
      const newEvent = {
        title: data.title,
        description: data.description || "",
        start: data.startDate.toISOString(),
        end: data.endDate.toISOString(),
        location: data.location || "",
        type: "meeting" as const,
        status: "confirmed" as const,
        createdBy: user.id,
        attendees: selectedAttendees,
        allDay: false,
      }

      createCalendarEvent(newEvent)

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error)
      toast({
        title: "Error",
        description: "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Schedule Employee Meeting</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <EnhancedDatePicker
                        date={field.value}
                        onDateChange={(date) => {
                          field.onChange(date)
                          // If end date is before new start date, update end date
                          const currentEndDate = form.getValues("endDate")
                          if (date && currentEndDate && isBefore(currentEndDate, date)) {
                            form.setValue("endDate", addHours(date, 1))
                          }
                          checkAvailability()
                        }}
                        placeholder="Select start date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <EnhancedDatePicker
                        date={field.value}
                        onDateChange={(date) => {
                          field.onChange(date)
                          checkAvailability()
                        }}
                        placeholder="Select end date"
                        minDate={form.getValues("startDate")}
                        disabledDates={(date) => {
                          const startDate = form.getValues("startDate")
                          return startDate ? isBefore(date, startDate) : false
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the exact meeting location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter meeting description" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <FormControl>
                    <UserAvailabilitySelector
                      selectedUsers={selectedAttendees}
                      onSelectUsers={(users) => {
                        setSelectedAttendees(users)
                        field.onChange(users)
                        checkAvailability()
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAttendees.length > 0 && startDate && (
              <UserAvailabilityDisplay userIds={selectedAttendees} date={startDate} />
            )}

            {availabilityConflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Availability Conflicts</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <p>The following attendees are unavailable during the selected time:</p>
                    <ul className="list-disc pl-5">
                      {availabilityConflicts.map((conflict, index) => (
                        <li key={index}>
                          <span className="font-medium">{conflict.userName}</span>: {conflict.reason}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        id="override"
                        type="checkbox"
                        checked={overrideAvailability}
                        onChange={(e) => setOverrideAvailability(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="override" className="text-sm cursor-pointer">
                        Override availability conflicts and schedule anyway
                      </label>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
