"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvailabilityIndicator } from "./availability-indicator"

export function AvailabilityStatusLegend() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Availability Legend</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        </div>
        <CardDescription>Understanding availability indicators</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Unavailable</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/20"></div>
              <span>Available Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/20"></div>
              <span>Unavailable Day</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/20"></div>
              <span>Partial Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-500"></div>
              <span>Date Range Selection</span>
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Interactions:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <AvailabilityIndicator isAvailable={true} onToggle={() => {}} onDetailView={() => {}} />
                    <span>
                      <strong>Single-click:</strong> Toggle availability
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AvailabilityIndicator isAvailable={true} onToggle={() => {}} onDetailView={() => {}} />
                    <span>
                      <strong>Double-click:</strong> Open detailed settings
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900/30 ring-2 ring-blue-600 ring-offset-2"></div>
                      <span>→</span>
                      <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-500"></div>
                    </div>
                    <span>
                      <strong>Date Range:</strong> Select start and end dates
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2">Date Range Selection:</h4>
                <p className="text-sm">
                  Enable date range selection mode using the toggle at the top of the calendar. Then click on a start
                  date followed by an end date to select a range. This allows you to set availability for multiple days
                  at once.
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
