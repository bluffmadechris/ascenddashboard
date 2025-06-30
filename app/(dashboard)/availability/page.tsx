"use client"

import { useState, useEffect } from "react"
import { format, addMonths, subMonths, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { AvailabilityManager } from "@/components/calendar/availability-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadUserAvailability, saveUserAvailability, type Availability } from "@/lib/calendar-utils"
import { TimeSlotManager } from "@/components/calendar/time-slot-manager"
import { AvailabilityLegend } from "@/components/calendar/availability-legend"
import { AvailabilityToggleCalendar } from "@/components/calendar/availability-toggle-calendar"
import { CalendarIcon, Calendar } from "lucide-react"
import Link from "next/link"

export default function AvailabilityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("calendar")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [nextMonth, setNextMonth] = useState(addMonths(new Date(), 1))
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [selectedDays, setSelectedDays] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Load user availability
  useEffect(() => {
    if (!user) return

    try {
      setIsLoading(true)
      const userAvailability = loadUserAvailability(user.id)

      if (userAvailability) {
        setAvailability(userAvailability)
      } else {
        // Create default availability
        const defaultAvailability: Availability = {
          userId: user.id,
          dates: [],
          defaultStartTime: "09:00",
          defaultEndTime: "17:00",
          unavailableSlots: [],
        }
        setAvailability(defaultAvailability)
      }
    } catch (error) {
      console.error("Error loading availability:", error)
      toast({
        title: "Error",
        description: "Failed to load availability settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setCurrentDate(subMonths(currentDate, 1))
    setNextMonth(subMonths(nextMonth, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setCurrentDate(addMonths(currentDate, 1))
    setNextMonth(addMonths(nextMonth, 1))
  }

  // Handle availability update
  const handleAvailabilityUpdated = () => {
    if (!user) return

    try {
      const updatedAvailability = loadUserAvailability(user.id)
      if (updatedAvailability) {
        setAvailability(updatedAvailability)
      }

      toast({
        title: "Availability updated",
        description: "Your availability settings have been saved",
      })
    } catch (error) {
      console.error("Error updating availability:", error)
    }
  }

  // Save availability changes
  const saveAvailabilityChanges = () => {
    if (!user || !availability) return

    try {
      // Update availability for selected days
      const updatedDates = [...availability.dates]

      selectedDays.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const existingIndex = updatedDates.findIndex((d) => d.date === dateStr)

        if (existingIndex !== -1) {
          // Toggle availability
          updatedDates[existingIndex] = {
            ...updatedDates[existingIndex],
            available: !updatedDates[existingIndex].available,
          }
        } else {
          // Create new entry with default times
          updatedDates.push({
            date: dateStr,
            available: true, // Default to available when adding new dates
            startTime: availability.defaultStartTime,
            endTime: availability.defaultEndTime,
          })
        }
      })

      // Save updated availability
      const updatedAvailability: Availability = {
        ...availability,
        dates: updatedDates,
      }

      saveUserAvailability(updatedAvailability)
      setAvailability(updatedAvailability)
      setSelectedDays([]) // Clear selection

      toast({
        title: "Availability saved",
        description: "Your availability changes have been saved",
      })
    } catch (error) {
      console.error("Error saving availability:", error)
      toast({
        title: "Error",
        description: "Failed to save availability changes",
        variant: "destructive",
      })
    }
  }

  // Cancel availability changes
  const cancelAvailabilityChanges = () => {
    setSelectedDays([])
    toast({
      title: "Changes discarded",
      description: "Your availability changes have been discarded",
    })
  }

  // Check if a day is available
  const isDayAvailable = (day: Date): boolean => {
    if (!availability) return false

    const dateStr = format(day, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    // If no specific availability is set, default to available on weekdays
    if (!dateAvail) {
      const dayOfWeek = day.getDay()
      return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
    }

    return dateAvail.available
  }

  // Toggle day selection
  const toggleDaySelection = (day: Date) => {
    setSelectedDays((prev) => {
      const isSelected = prev.some((d) => isSameDay(d, day))
      if (isSelected) {
        return prev.filter((d) => !isSameDay(d, day))
      } else {
        return [...prev, day]
      }
    })
  }

  // Open time slot manager for a specific day
  const openTimeSlotManager = (day: Date) => {
    setSelectedDate(day)
    setShowTimeSlotManager(true)
  }

  const handleTimeSlotManagerClosed = () => {
    setShowTimeSlotManager(false)
    // Refresh availability data
    if (user) {
      const updatedAvailability = loadUserAvailability(user.id)
      if (updatedAvailability) {
        setAvailability(updatedAvailability)
      }
    }
  }

  // Format month and year for display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Availability</h1>
        <Link href="/calendar?view=availability">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            View in Calendar
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="time-slots">Time Slots</TabsTrigger>
          <TabsTrigger value="settings">Weekly Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <AvailabilityLegend />
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Calendar View</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                    Previous
                  </Button>
                  <span className="font-medium">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    Next
                  </Button>
                </div>
              </div>
              <CardDescription>
                Click on days to toggle availability. Green indicates available, red indicates unavailable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityToggleCalendar month={currentMonth} year={currentYear} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-slots" className="mt-6">
          <TimeSlotManager date={selectedDate} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AvailabilityManager onAvailabilityUpdated={handleAvailabilityUpdated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
