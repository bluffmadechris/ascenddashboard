"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        linkEditor: "border border-input bg-background hover:bg-blue-100 hover:text-blue-600 transition-colors",
        available: "bg-green-200 text-green-800 hover:bg-green-300 border border-green-300",
        unavailable: "bg-red-200 text-red-800 hover:bg-red-300 border border-red-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  href?: string
  target?: string
  rel?: string
  availability?: "available" | "unavailable" | null
  onAvailabilityChange?: (availability: "available" | "unavailable") => void
  calendar?: boolean
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  calendarPlacement?: "top" | "bottom" | "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      href,
      target,
      rel,
      availability,
      onAvailabilityChange,
      calendar = false,
      date,
      onDateChange,
      calendarPlacement = "bottom",
      ...props
    },
    ref,
  ) => {
    // If availability is set, override the variant
    const effectiveVariant = availability ? availability : variant
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

    // Handle availability toggle
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (availability !== null && availability !== undefined && onAvailabilityChange) {
        // Toggle availability
        const newAvailability = availability === "available" ? "unavailable" : "available"
        onAvailabilityChange(newAvailability)
      }

      // Call the original onClick handler if it exists
      if (props.onClick) {
        props.onClick(e)
      }
    }

    // Handle date selection
    const handleDateSelect = (date: Date | undefined) => {
      setSelectedDate(date)
      if (onDateChange) {
        onDateChange(date)
      }
    }

    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant: effectiveVariant, size, className }))} ref={ref} {...props} />
      )
    }

    if (href) {
      return (
        <Link
          href={href}
          className={cn(buttonVariants({ variant: effectiveVariant, size, className }))}
          target={target}
          rel={rel}
        >
          {props.children}
        </Link>
      )
    }

    // If calendar is true, wrap the button in a Popover
    if (calendar) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(buttonVariants({ variant: effectiveVariant, size, className }))}
              ref={ref}
              type={props.type || "button"}
              {...props}
            >
              {selectedDate ? (
                <span className="flex items-center gap-2">
                  {props.children}
                  <span className="text-xs opacity-70">{format(selectedDate, "PP")}</span>
                </span>
              ) : (
                props.children
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align={calendarPlacement === "left" ? "start" : calendarPlacement === "right" ? "end" : undefined}
            side={calendarPlacement === "top" ? "top" : calendarPlacement === "bottom" ? "bottom" : undefined}
          >
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant: effectiveVariant, size, className }))}
        ref={ref}
        type={props.type || "button"}
        onClick={availability !== null && availability !== undefined ? handleClick : props.onClick}
        aria-label={
          props["aria-label"] ||
          (availability ? `Mark as ${availability === "available" ? "unavailable" : "available"}` : undefined)
        }
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
