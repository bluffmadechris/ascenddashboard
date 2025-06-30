"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isValid } from "date-fns"
import { Clock, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  type Availability,
  type DateAvailability,
  loadUserAvailability,
  saveUserAvailability,
} from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"

interface AvailabilityManagerProps {
  onAvailabilityUpdated?: () => void
}

export function AvailabilityManager({ onAvailabilityUpdated }: AvailabilityManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("weekly")

  // Weekly availability state
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    monday: { available: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
    thursday: { available: true, startTime: "09:00", endTime: "17:00" },
    friday: { available: true, startTime: "09:00", endTime: "17:00" },
    saturday: { available: false, startTime: "09:00", endTime: "17:00" },
    sunday: { available: false, startTime: "09:00", endTime: "17:00" },
  })

  // Default working hours
  const [defaultStartTime, setDefaultStartTime] = useState("09:00")
  const [defaultEndTime, setDefaultEndTime] = useState("17:00")

  // Specific date availability
  const [dateAvailability, setDateAvailability] = useState<DateAvailability[]>([])

  // Load user availability
  useEffect(() => {
    if (!user) return

    try {
      const availability = loadUserAvailability(user.id)

      if (availability) {
        // Set default times
        setDefaultStartTime(availability.defaultStartTime || "09:00")
        setDefaultEndTime(availability.defaultEndTime || "17:00")

        // Set date-specific availability
        setDateAvailability(availability.dates || [])

        // Set weekly availability based on the first week of dates
        const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const newWeeklyAvailability = { ...weeklyAvailability }

        weekDays.forEach((day, index) => {
          // Find dates that match this day of week
          const datesForDay = availability.dates.filter((d) => {
            try {
              const date = parseISO(d.date)
              return isValid(date) && date.getDay() === index
            } catch (e) {
              return false
            }
          })

          if (datesForDay.length > 0) {
            // Use the most recent date's availability
            const mostRecent = datesForDay.sort((a, b) => b.date.localeCompare(a.date))[0]
            newWeeklyAvailability[day as keyof typeof newWeeklyAvailability] = {
              available: mostRecent.available,
              startTime: mostRecent.startTime,
              endTime: mostRecent.endTime,
            }
          }
        })

        setWeeklyAvailability(newWeeklyAvailability)
      }
    } catch (error) {
      console.error("Error loading availability:", error)
    }
  }, [user])

  // Handle weekly availability changes
  const handleWeeklyAvailabilityChange = (
    day: keyof typeof weeklyAvailability,
    field: "available" | "startTime" | "endTime",
    value: boolean | string,
  ) => {
    setWeeklyAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  // Apply weekly schedule to all future dates
  const applyWeeklySchedule = () => {
    if (!user) return

    try {
      // Generate availability for the next 90 days based on weekly settings
      const now = new Date()
      const newDates: DateAvailability[] = []

      for (let i = 0; i < 90; i++) {
        const date = new Date()
        date.setDate(now.getDate() + i)

        const dayOfWeek = date.getDay()
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const dayName = dayNames[dayOfWeek] as keyof typeof weeklyAvailability
        const daySettings = weeklyAvailability[dayName]

        newDates.push({
          date: format(date, "yyyy-MM-dd"),
          available: daySettings.available,
          startTime: daySettings.startTime,
          endTime: daySettings.endTime,
        })
      }

      // Save the new availability
      const availability: Availability = {
        userId: user.id,
        dates: newDates,
        defaultStartTime,
        defaultEndTime,
      }

      saveUserAvailability(availability)
      setDateAvailability(newDates)

      toast({
        title: "Availability updated",
        description: "Your weekly availability has been applied to all future dates.",
      })

      if (onAvailabilityUpdated) {
        onAvailabilityUpdated()
      }
    } catch (error) {
      console.error("Error applying weekly schedule:", error)
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Save default working hours
  const saveDefaultHours = () => {
    if (!user) return

    try {
      // Validate times
      if (defaultStartTime >= defaultEndTime) {
        toast({
          title: "Invalid times",
          description: "End time must be after start time.",
          variant: "destructive",
        })
        return
      }

      // Get existing availability or create new
      const existingAvailability = loadUserAvailability(user.id) || {
        userId: user.id,
        dates: [],
        defaultStartTime: "09:00",
        defaultEndTime: "17:00",
      }

      // Update default times
      existingAvailability.defaultStartTime = defaultStartTime
      existingAvailability.defaultEndTime = defaultEndTime

      // Save
      saveUserAvailability(existingAvailability)

      toast({
        title: "Default hours updated",
        description: "Your default working hours have been updated.",
      })

      if (onAvailabilityUpdated) {
        onAvailabilityUpdated()
      }
    } catch (error) {
      console.error("Error saving default hours:", error)
      toast({
        title: "Error",
        description: "Failed to update default hours. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Reset all availability settings
  const resetAvailability = () => {
    if (!user) return

    if (confirm("Are you sure you want to reset all availability settings? This cannot be undone.")) {
      try {
        // Reset to default values
        const defaultWeeklyAvailability = {
          monday: { available: true, startTime: "09:00", endTime: "17:00" },
          tuesday: { available: true, startTime: "09:00", endTime: "17:00" },
          wednesday: { available: true, startTime: "09:00", endTime: "17:00" },
          thursday: { available: true, startTime: "09:00", endTime: "17:00" },
          friday: { available: true, startTime: "09:00", endTime: "17:00" },
          saturday: { available: false, startTime: "09:00", endTime: "17:00" },
          sunday: { available: false, startTime: "09:00", endTime: "17:00" },
        }

        setWeeklyAvailability(defaultWeeklyAvailability)
        setDefaultStartTime("09:00")
        setDefaultEndTime("17:00")
        setDateAvailability([])

        // Save empty availability
        const availability: Availability = {
          userId: user.id,
          dates: [],
          defaultStartTime: "09:00",
          defaultEndTime: "17:00",
        }

        saveUserAvailability(availability)

        toast({
          title: "Availability reset",
          description: "Your availability settings have been reset to default.",
        })

        if (onAvailabilityUpdated) {
          onAvailabilityUpdated()
        }
      } catch (error) {
        console.error("Error resetting availability:", error)
        toast({
          title: "Error",
          description: "Failed to reset availability. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Availability</CardTitle>
        <CardDescription>Set your regular working hours and availability for meetings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="defaults">Default Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <div className="space-y-4">
              {Object.entries(weeklyAvailability).map(([day, settings]) => (
                <div key={day} className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`available-${day}`}
                        checked={settings.available}
                        onCheckedChange={(checked) =>
                          handleWeeklyAvailabilityChange(day as keyof typeof weeklyAvailability, "available", checked)
                        }
                      />
                      <Label htmlFor={`available-${day}`} className="capitalize font-medium">
                        {day}
                      </Label>
                    </div>

                    <div className={cn("flex items-center space-x-2", !settings.available && "opacity-50")}>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={settings.startTime}
                          onChange={(e) =>
                            handleWeeklyAvailabilityChange(
                              day as keyof typeof weeklyAvailability,
                              "startTime",
                              e.target.value,
                            )
                          }
                          disabled={!settings.available}
                          className="w-24"
                        />
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={settings.endTime}
                        onChange={(e) =>
                          handleWeeklyAvailabilityChange(
                            day as keyof typeof weeklyAvailability,
                            "endTime",
                            e.target.value,
                          )
                        }
                        disabled={!settings.available}
                        className="w-24"
                      />
                    </div>
                  </div>

                  {settings.available && settings.startTime >= settings.endTime && (
                    <p className="text-sm text-red-500 ml-10">End time must be after start time</p>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={applyWeeklySchedule} className="w-full mt-4">
              <Save className="h-4 w-4 mr-2" />
              Apply Weekly Schedule
            </Button>
          </TabsContent>

          <TabsContent value="defaults" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-start">Default Start Time</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="default-start"
                      type="time"
                      value={defaultStartTime}
                      onChange={(e) => setDefaultStartTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-end">Default End Time</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="default-end"
                      type="time"
                      value={defaultEndTime}
                      onChange={(e) => setDefaultEndTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {defaultStartTime >= defaultEndTime && (
                <p className="text-sm text-red-500">End time must be after start time</p>
              )}

              <Button onClick={saveDefaultHours} className="w-full mt-4" disabled={defaultStartTime >= defaultEndTime}>
                <Save className="h-4 w-4 mr-2" />
                Save Default Hours
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={resetAvailability}>
          <X className="h-4 w-4 mr-2" />
          Reset All Settings
        </Button>
      </CardFooter>
    </Card>
  )
}
