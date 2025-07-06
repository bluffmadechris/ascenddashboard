"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllStrikes, removeStrike, addStrike, Strike } from "@/lib/strikes-system"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { Plus, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface StrikesManagementProps {
    onStrikeRemoved?: () => void;
}

interface User {
    id: string;
    name?: string;
    email: string;
}

export function StrikesManagement({ onStrikeRemoved }: StrikesManagementProps) {
    const { user: currentUser } = useAuth()
    const [strikes, setStrikes] = useState<(Strike & { userName: string })[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState("")
    const [strikeReason, setStrikeReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchStrikes = async () => {
        try {
            // Get all users first - set a high limit to get all users
            const response = await api.get('/users?limit=1000')

            // Log the response for debugging
            console.log('Users API Response:', response)

            // Check if we have a valid response
            if (!response?.success) {
                throw new Error('Failed to fetch users data')
            }

            const usersData = response.data?.users
            if (!Array.isArray(usersData)) {
                console.error('Users data structure:', response.data)
                throw new Error('Invalid users data format')
            }

            setUsers(usersData)

            // Get all strikes for each user
            const allStrikes: (Strike & { userName: string })[] = []
            usersData.forEach((user: User) => {
                const userStrikes = getAllStrikes(user.id)
                const strikesWithUserName = userStrikes.map(strike => ({
                    ...strike,
                    userName: user.name || user.email
                }))
                allStrikes.push(...strikesWithUserName)
            })

            // Sort strikes by date (newest first)
            allStrikes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            setStrikes(allStrikes)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching strikes:', error)
            // Log additional error details if available
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                })
            }
            toast.error('Failed to fetch strikes. Please try again later.')
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStrikes()
    }, [])

    const handleRemoveStrike = async (strikeId: string) => {
        try {
            removeStrike(strikeId)
            toast.success('Strike removed successfully')
            fetchStrikes() // Refresh the list
            if (onStrikeRemoved) {
                onStrikeRemoved()
            }
        } catch (error) {
            console.error('Error removing strike:', error)
            toast.error('Failed to remove strike')
        }
    }

    const handleAddStrike = async () => {
        if (!selectedUserId || !strikeReason.trim() || !currentUser) {
            toast.error('Please select a user and provide a reason')
            return
        }

        setIsSubmitting(true)
        try {
            const issuedBy = currentUser.name || currentUser.email || "Owner"
            const success = await addStrike(selectedUserId, strikeReason.trim(), issuedBy)
            if (success) {
                toast.success('Strike added successfully')
                setSelectedUserId("")
                setStrikeReason("")
                setShowAddDialog(false)
                fetchStrikes() // Refresh the list
            } else {
                toast.error('Failed to add strike')
            }
        } catch (error) {
            console.error('Error adding strike:', error)
            toast.error('Failed to add strike')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-2">Loading strikes...</span>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Strikes Management</CardTitle>
                        <CardDescription>View and manage strikes for all team members.</CardDescription>
                    </div>
                    {currentUser?.role === "owner" && (
                        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Strike
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Strike</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="user-select">Select User</Label>
                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a team member" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.filter(user => user.id !== currentUser?.id).map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name || user.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="reason">Reason for Strike</Label>
                                        <Textarea
                                            id="reason"
                                            value={strikeReason}
                                            onChange={(e) => setStrikeReason(e.target.value)}
                                            placeholder="Describe the reason for this strike..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowAddDialog(false)}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddStrike}
                                            disabled={isSubmitting || !selectedUserId || !strikeReason.trim()}
                                            variant="destructive"
                                        >
                                            {isSubmitting ? "Adding..." : "Add Strike"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {strikes.length === 0 ? (
                    <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No strikes found.</p>
                        {currentUser?.role === "owner" && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Use the "Add Strike" button to issue strikes to team members.
                            </p>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Member</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Issued By</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {strikes.map((strike) => (
                                <TableRow key={strike.id}>
                                    <TableCell>{strike.userName}</TableCell>
                                    <TableCell className="max-w-xs">
                                        <div className="truncate" title={strike.reason}>
                                            {strike.reason}
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(strike.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{strike.issuedBy}</TableCell>
                                    <TableCell>
                                        {currentUser?.role === "owner" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveStrike(strike.id)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
} 