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
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UserAvailabilitySelector } from "./user-availability-selector"
import { UserAvailabilityDisplay } from "./user-availability-display"
import { checkUsersAvailability } from "@/lib/availability-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { createMeetingRequest } from "@/lib/meeting-request"

// Define the form schema
const meetingFormSchema = z
  .object({
    subject: z.string().min(1, "Subject is required"),
    proposedDate: z.date({
      required_error: "Date is required",
    }),
    description: z.string().optional(),
    targetUserId: z.string().min(1, "Target user is required"),
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
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  // Set default values
  const defaultValues: Partial<MeetingFormValues> = {
    subject: "",
    proposedDate: initialDate || new Date(),
    description: "",
    targetUserId: "",
  }

  // Initialize form
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues,
  })

  // Handle form submission
  const onSubmit = async (data: MeetingFormValues) => {
    if (!user) return

    try {
      setIsSubmitting(true)
      console.log('Form data:', data);

      const result = await createMeetingRequest({
        targetUserId: data.targetUserId,
        subject: data.subject,
        description: data.description,
        proposedDate: data.proposedDate.toISOString(),
      })

      if (!result) {
        throw new Error("Failed to create meeting request")
      }

      toast({
        title: "Success",
        description: "Meeting request sent successfully",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Meeting request error:", error)
      toast({
        title: "Error",
        description: "Failed to send meeting request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Request Employee Meeting</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Date & Time</FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      date={field.value}
                      onDateChange={(date) => {
                        field.onChange(date)
                      }}
                      placeholder="Select proposed date"
                    />
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
              name="targetUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Target User</FormLabel>
                  <FormControl>
                    <UserAvailabilitySelector
                      onUserSelect={(userId) => {
                        field.onChange(userId)
                        setSelectedUser(userId)
                      }}
                      selectedUsers={selectedUser ? [selectedUser] : []}
                      maxUsers={1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedUser && (
              <UserAvailabilityDisplay
                userId={selectedUser}
                date={form.getValues("proposedDate")}
              />
            )}

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
