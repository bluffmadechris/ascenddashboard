"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function PasswordChangeRequestForm() {
    const { user } = useAuth()
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason) {
            toast.error("Please provide a reason for the password change")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await apiClient.createPasswordChangeRequest({
                reason,
            })

            if (!response.success) {
                throw new Error(response.message || "Failed to submit request")
            }

            toast.success("Password change request submitted successfully")
            setReason("")
        } catch (error) {
            console.error("Error submitting password change request:", error)
            toast.error("Failed to submit password change request")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (user?.role === "owner") {
        return null // Don't show the form for owners
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Password Change</CardTitle>
                <CardDescription>
                    Submit a request to change your password. An owner will review your request and set a new password for you if approved.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Change</Label>
                        <Input
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why do you need to change your password?"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
} 