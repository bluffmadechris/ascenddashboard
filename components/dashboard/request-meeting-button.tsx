"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface RequestMeetingButtonProps {
    memberId: string
    disabled?: boolean
    className?: string
}

export function RequestMeetingButton({ memberId, disabled, className }: RequestMeetingButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleClick = async () => {
        setIsLoading(true)
        try {
            // Navigate to schedule meeting page with the member ID
            router.push(`/schedule-meeting?memberId=${memberId}`)
        } catch (error) {
            console.error("Failed to initiate meeting request:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="secondary"
            className={cn("w-full", className)}
            onClick={handleClick}
            disabled={disabled || isLoading}
        >
            <Calendar className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Request Meeting"}
        </Button>
    )
} 