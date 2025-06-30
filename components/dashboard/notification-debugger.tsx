"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useNotifications } from "@/lib/api-notifications-context"
import {
  countNotificationsInStorage,
  forceCleanupNotifications,
  verifyNotificationStateConsistency,
  simulatePageReload,
} from "@/lib/test-notification-utils"
import { toast } from "@/components/ui/use-toast"

export function NotificationDebugger() {
  const { notifications, clearAll } = useNotifications()
  const [storageCount, setStorageCount] = useState(0)
  const [isConsistent, setIsConsistent] = useState(true)
  const [details, setDetails] = useState("")

  // Update storage count periodically
  useEffect(() => {
    const updateStorageCount = () => {
      const count = countNotificationsInStorage()
      setStorageCount(count)

      // Check consistency
      const { consistent, details } = verifyNotificationStateConsistency(
        notifications.length,
        notifications.length, // UI count should match context count
      )

      setIsConsistent(consistent)
      setDetails(details)
    }

    // Initial check
    updateStorageCount()

    // Set up interval
    const interval = setInterval(updateStorageCount, 2000)

    // Listen for storage events
    const handleStorageChange = () => {
      updateStorageCount()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("notificationsCleared", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("notificationsCleared", handleStorageChange)
    }
  }, [notifications.length])

  const handleForceCleanup = () => {
    forceCleanupNotifications()
    toast({
      title: "Forced Cleanup",
      description: "Notifications have been forcibly removed from storage",
    })
  }

  const handleSimulateReload = () => {
    simulatePageReload()
    toast({
      title: "Simulated Reload",
      description: "Page reload has been simulated",
    })
  }

  const handleTestClearAll = async () => {
    try {
      await clearAll()
      toast({
        title: "Clear All Executed",
        description: "The clearAll function has been executed directly",
      })
    } catch (error) {
      console.error("Error testing clearAll:", error)
      toast({
        title: "Error",
        description: "There was an error executing clearAll",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Notification Debugger</CardTitle>
        <CardDescription>Diagnose and fix notification issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Context Count:</div>
            <div className="text-sm">{notifications.length}</div>

            <div className="text-sm font-medium">Storage Count:</div>
            <div className="text-sm">{storageCount}</div>

            <div className="text-sm font-medium">State Consistent:</div>
            <div className={`text-sm ${isConsistent ? "text-green-600" : "text-red-600 font-bold"}`}>
              {isConsistent ? "Yes" : "No"}
            </div>

            <div className="text-sm font-medium">Details:</div>
            <div className="text-sm">{details}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleTestClearAll}>
            Test Clear All
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handleSimulateReload}>
            Simulate Reload
          </Button>
        </div>
        <Button variant="destructive" size="sm" className="w-full" onClick={handleForceCleanup}>
          Force Cleanup
        </Button>
      </CardFooter>
    </Card>
  )
}
