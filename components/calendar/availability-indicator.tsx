"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AvailabilityIndicatorProps {
  isAvailable: boolean
  onToggle: () => void
  onDetailView: () => void
  size?: "sm" | "md" | "lg"
  className?: string
  showTooltip?: boolean
}

export function AvailabilityIndicator({
  isAvailable,
  onToggle,
  onDetailView,
  size = "md",
  className,
  showTooltip = true,
}: AvailabilityIndicatorProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const clickTimer = useRef<NodeJS.Timeout | null>(null)
  const clickCount = useRef(0)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current)
      }
    }
  }, [])

  // Handle click with debounce for detecting single vs double click
  const handleClick = () => {
    clickCount.current += 1

    if (clickCount.current === 1) {
      // Set a timeout to detect if this is a single click
      clickTimer.current = setTimeout(() => {
        // This is a single click
        onToggle()
        clickCount.current = 0
        clickTimer.current = null
      }, 300) // 300ms threshold for double click
    } else if (clickCount.current === 2) {
      // This is a double click
      if (clickTimer.current) {
        clearTimeout(clickTimer.current)
        clickTimer.current = null
      }
      clickCount.current = 0
      onDetailView()
    }
  }

  // Get size classes
  const sizeClasses = {
    sm: "h-4 w-4 min-h-4 min-w-4",
    md: "h-6 w-6 min-h-6 min-w-6",
    lg: "h-8 w-8 min-h-8 min-w-8",
  }

  // Animation for press effect
  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPressed(false)
  }

  const indicator = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "rounded-full p-0 border-2 transition-all duration-200 relative",
        isPressed ? "scale-90" : isHovered ? "scale-110" : "scale-100",
        isAvailable ? "border-green-500" : "border-red-500",
        sizeClasses[size],
        className,
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={isAvailable ? "Available, click to mark as unavailable" : "Unavailable, click to mark as available"}
    >
      <div
        className={cn(
          "absolute inset-1 rounded-full transition-all duration-200",
          isAvailable ? "bg-green-500" : "bg-red-500",
        )}
      />
      {isHovered && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
    </Button>
  )

  if (!showTooltip) return indicator

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>
            {isAvailable ? "Available" : "Unavailable"}
            <br />
            <span className="text-xs text-muted-foreground">Click to toggle, double-click for details</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
