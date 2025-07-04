"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvailabilityIndicatorProps {
  available: boolean
  onClick?: () => void
  className?: string
}

export function AvailabilityIndicator({
  available,
  onClick,
  className,
}: AvailabilityIndicatorProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        "flex items-center justify-center transition-colors rounded-full p-1",
        "hover:bg-accent/50",
        available ? "text-green-600" : "text-red-600",
        className
      )}
    >
      {available ? (
        <Check className="h-4 w-4" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  )
}
