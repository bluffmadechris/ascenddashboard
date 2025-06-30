"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ScheduleMeetingForm } from "@/components/calendar/schedule-meeting-form"
import { parseISO } from "date-fns"

export default function ScheduleMeetingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial date from query params if available
  const dateParam = searchParams.get("date")
  const initialDate = dateParam ? parseISO(dateParam) : undefined

  const handleSuccess = () => {
    router.push("/calendar")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container py-10">
      <ScheduleMeetingForm onSuccess={handleSuccess} onCancel={handleCancel} initialDate={initialDate} />
    </div>
  )
}
