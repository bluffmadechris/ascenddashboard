"use client"

import { useState, useEffect } from "react"
import { format, isValid } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { loadUserAvailability } from "@/lib/calendar-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserAvailabilityDisplayProps {
  userIds: string[]
  date: Date
  className?: string
}

interface UserAvailabilityInfo {
  userId: string
  userName: string
  userAvatar?: string
  available: boolean
  startTime?: string
  endTime?: string
}

export function UserAvailabilityDisplay({ userIds, date, className }: UserAvailabilityDisplayProps) {
  const { users } = useAuth()
  const [userAvailability, setUserAvailability] = useState<UserAvailabilityInfo[]>([])

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Load availability for all selected users
  useEffect(() => {
    if (!isValid(date) || userIds.length === 0) {
      setUserAvailability([])
      return
    }

    const dateStr = format(date, "yyyy-MM-dd")
    const availabilityInfo: UserAvailabilityInfo[] = []

    userIds.forEach((userId) => {
      const user = users.find((u) => u.id === userId)
      if (!user) return

      const availability = loadUserAvailability(userId)
      if (!availability) {
        // If no availability data, assume available during business hours
        availabilityInfo.push({
          userId,
          userName: user.name,
          userAvatar: user.avatar,
          available: true,
          startTime: "09:00",
          endTime: "17:00",
        })
        return
      }

      // Find availability for this date
      const dateAvailability = availability.dates.find((d) => d.date === dateStr)

      if (!dateAvailability) {
        // If no specific date availability, check if it's a weekday
        const dayOfWeek = date.getDay()
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

        availabilityInfo.push({
          userId,
          userName: user.name,
          userAvatar: user.avatar,
          available: isWeekday, // Default to available on weekdays
          startTime: isWeekday ? availability.defaultStartTime : undefined,
          endTime: isWeekday ? availability.defaultEndTime : undefined,
        })
      } else {
        // Use the specific date availability
        availabilityInfo.push({
          userId,
          userName: user.name,
          userAvatar: user.avatar,
          available: dateAvailability.available,
          startTime: dateAvailability.available ? dateAvailability.startTime : undefined,
          endTime: dateAvailability.available ? dateAvailability.endTime : undefined,
        })
      }
    })

    setUserAvailability(availabilityInfo)
  }, [userIds, date, users])

  if (userIds.length === 0) {
    return null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Availability for {format(date, "MMMM d, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userAvailability.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No availability information available.</div>
        ) : (
          <div className="space-y-3">
            {userAvailability.map((info) => (
              <div key={info.userId} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={info.userAvatar || "/placeholder.svg"} alt={info.userName} />
                    <AvatarFallback>{getInitials(info.userName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{info.userName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {info.available ? (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Available
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Available from {info.startTime} to {info.endTime}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-muted-foreground">
                        {info.startTime} - {info.endTime}
                      </span>
                    </>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Unavailable
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
