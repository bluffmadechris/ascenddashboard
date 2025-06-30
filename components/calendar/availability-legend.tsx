"use client"

import { Clock } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export function AvailabilityLegend() {
  return (
    <Alert className="mb-4 bg-muted/50">
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" /> Understanding Availability Colors
      </AlertTitle>
      <AlertDescription className="mt-2">
        <ul className="grid gap-1.5 text-sm">
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-100 dark:bg-green-900/40"></div>
            <span>Available all day</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-100 dark:bg-amber-900/40"></div>
            <span>Available with some unavailable time slots</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-100 dark:bg-red-900/40"></div>
            <span>Unavailable all day</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Has specific unavailable time slots (hover for details)</span>
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  )
}
