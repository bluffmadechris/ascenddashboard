"use client"

import { format } from "date-fns"
import { loadUserAvailability } from "./calendar-utils"
import { useAuth } from "@/lib/auth-context"

export interface AvailabilityConflict {
  userId: string
  userName: string
  reason: string
}

// Check if all users are available at the specified time
export function checkUsersAvailability(
  userIds: string[],
  startTime: Date,
  endTime: Date,
): { available: boolean; conflicts: AvailabilityConflict[] } {
  const conflicts: AvailabilityConflict[] = []

  // Get all users from auth context
  const { users } = useAuth()

  // Check each user's availability
  userIds.forEach((userId) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const availability = loadUserAvailability(userId)
    if (!availability) {
      // If no availability data, assume available during business hours (9-5)
      const hour = startTime.getHours()
      if (hour < 9 || hour >= 17) {
        conflicts.push({
          userId,
          userName: user.name,
          reason: "Outside of default business hours (9 AM - 5 PM)",
        })
      }
      return
    }

    // Get the date string for the start date
    const dateStr = format(startTime, "yyyy-MM-dd")

    // Find availability for this date
    const dateAvailability = availability.dates.find((d) => d.date === dateStr)

    if (!dateAvailability) {
      // If no specific date availability, check if it's a weekday
      const dayOfWeek = startTime.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

      if (!isWeekday) {
        conflicts.push({
          userId,
          userName: user.name,
          reason: "Weekend (no availability set)",
        })
      } else {
        // Check if within default business hours
        const defaultStart = new Date(startTime)
        const [defaultStartHour, defaultStartMinute] = availability.defaultStartTime.split(":").map(Number)
        defaultStart.setHours(defaultStartHour, defaultStartMinute, 0, 0)

        const defaultEnd = new Date(startTime)
        const [defaultEndHour, defaultEndMinute] = availability.defaultEndTime.split(":").map(Number)
        defaultEnd.setHours(defaultEndHour, defaultEndMinute, 0, 0)

        if (startTime < defaultStart || endTime > defaultEnd) {
          conflicts.push({
            userId,
            userName: user.name,
            reason: `Outside of default working hours (${availability.defaultStartTime} - ${availability.defaultEndTime})`,
          })
        }
      }
    } else {
      // Check if user is available on this date
      if (!dateAvailability.available) {
        conflicts.push({
          userId,
          userName: user.name,
          reason: "Marked as unavailable for this day",
        })
        return
      }

      // Check if within available hours
      const availStart = new Date(startTime)
      const [availStartHour, availStartMinute] = dateAvailability.startTime.split(":").map(Number)
      availStart.setHours(availStartHour, availStartMinute, 0, 0)

      const availEnd = new Date(startTime)
      const [availEndHour, availEndMinute] = dateAvailability.endTime.split(":").map(Number)
      availEnd.setHours(availEndHour, availEndMinute, 0, 0)

      if (startTime < availStart || endTime > availEnd) {
        conflicts.push({
          userId,
          userName: user.name,
          reason: `Outside of available hours (${dateAvailability.startTime} - ${dateAvailability.endTime})`,
        })
      }
    }
  })

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}
