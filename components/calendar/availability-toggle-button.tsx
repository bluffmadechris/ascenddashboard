"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface AvailabilityToggleButtonProps {
  date: Date | string
  initialAvailability?: "available" | "unavailable"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  onAvailabilityChange?: (date: Date | string, availability: "available" | "unavailable") => void
}

export function AvailabilityToggleButton({
  date,
  initialAvailability = "available",
  className,
  size = "icon",
  onAvailabilityChange,
}: AvailabilityToggleButtonProps) {
  // Convert string date to Date object if needed
  const dateObj = typeof date === "string" ? new Date(date) : date
  const dateKey = dateObj.toISOString().split("T")[0] // Format as YYYY-MM-DD

  // State to track availability
  const [availability, setAvailability] = useState<"available" | "unavailable">(initialAvailability)

  // Load saved availability on mount
  useEffect(() => {
    const savedAvailability = localStorage.getItem(`availability-${dateKey}`)
    if (savedAvailability) {
      setAvailability(savedAvailability as "available" | "unavailable")
    }
  }, [dateKey])

  // Handle availability change
  const handleClick = () => {
    const newAvailability = availability === "available" ? "unavailable" : "available"
    setAvailability(newAvailability)

    // Save to localStorage for persistence
    localStorage.setItem(`availability-${dateKey}`, newAvailability)

    // Call the callback if provided
    if (onAvailabilityChange) {
      onAvailabilityChange(date, newAvailability)
    }
  }

  // Format the date for display
  const day = dateObj.getDate()

  return (
    <Button
      className={className}
      size={size}
      variant={availability === "available" ? "available" : "unavailable"}
      onClick={handleClick}
      aria-label={`${day}: ${availability === "available" ? "Available" : "Unavailable"}`}
    >
      {day}
    </Button>
  )
}
