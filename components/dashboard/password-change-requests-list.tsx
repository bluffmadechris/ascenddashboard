"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PasswordChangeRequest {
    id: string
    userId: string
    userName: string
    reason: string
    status: "pending" | "approved" | "denied"
    createdAt: string
    updatedAt: string
}

export function PasswordChangeRequestsList() {
    const { user } = useAuth()
    const [requests, setRequests] = useState<PasswordChangeRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<PasswordChangeRequest | null>(null)
    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showDenyDialog, setShowDenyDialog] = useState(false)
    const [newPassword, setNewPassword] = useState("")

    useEffect(() => {
        if (user?.role === "owner") {
            loadRequests()
        } else {
            setLoading(false)
        }
    }, [user])

    const loadRequests = async () => {
        try {
            const response = await apiClient.getPasswordChangeRequests()
            if (!response.success) {
                // Handle specific error cases silently
                if (response.message.includes("not found") ||
                    response.message.includes("404") ||
                    response.message.includes("permission") ||
                    response.message.includes("denied")) {
                    setRequests([])
                    return
                }
                throw new Error(response.message || "Failed to load requests")
            }
            setRequests(response.data?.requests || [])
            setError(null)
        } catch (error) {
            console.error("Error loading password change requests:", error)
            // Only show error toast for unexpected errors
            if (error instanceof Error &&
                !error.message.includes("not found") &&
                !error.message.includes("404") &&
                !error.message.includes("permission") &&
                !error.message.includes("denied")) {
                setError(error.message)
                toast.error("Failed to load password change requests")
            }
            setRequests([])
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!selectedRequest || !newPassword) return

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long")
            return
        }

        try {
            const response = await apiClient.approvePasswordChangeRequest(selectedRequest.id, newPassword)
            if (!response.success) {
                throw new Error(response.message || "Failed to approve request")
            }

            toast.success("Password change request approved")
            loadRequests() // Refresh the list
        } catch (error) {
            console.error("Error approving password change request:", error)
            toast.error("Failed to approve password change request")
        } finally {
            setShowApproveDialog(false)
            setSelectedRequest(null)
            setNewPassword("")
        }
    }

    const handleDeny = async () => {
        if (!selectedRequest) return

        try {
            const response = await apiClient.denyPasswordChangeRequest(selectedRequest.id)
            if (!response.success) {
                throw new Error(response.message || "Failed to deny request")
            }

            toast.success("Password change request denied")
            loadRequests() // Refresh the list
        } catch (error) {
            console.error("Error denying password change request:", error)
            toast.error("Failed to deny password change request")
        } finally {
            setShowDenyDialog(false)
            setSelectedRequest(null)
        }
    }

    if (!user || user.role !== "owner") {
        return null
    }

    if (loading) {
        return <div>Loading password change requests...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Password Change Requests</CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-center text-destructive py-4">
                        {error}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                        No pending password change requests
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.userName}</TableCell>
                                    <TableCell>{request.reason}</TableCell>
                                    <TableCell>
                                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                request.status === "approved"
                                                    ? "default"
                                                    : request.status === "denied"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                        >
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {request.status === "pending" && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setShowApproveDialog(true)
                                                    }}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setShowDenyDialog(true)
                                                    }}
                                                >
                                                    Deny
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <AlertDialog open={showApproveDialog} onOpenChange={(open) => {
                setShowApproveDialog(open)
                if (!open) {
                    setNewPassword("")
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Password Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Set a new password for {selectedRequest?.userName}. This will immediately update their password.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter the new password"
                            minLength={6}
                            required
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} disabled={!newPassword || newPassword.length < 6}>
                            Approve & Set Password
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deny Password Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to deny this password change request?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeny} className="bg-destructive">
                            Deny
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
} 