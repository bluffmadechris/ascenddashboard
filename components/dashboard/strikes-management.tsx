"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getAllStrikes, removeStrike, Strike } from "@/lib/strikes-system"
import { toast } from "sonner"
import { api } from "@/lib/api-client"

interface StrikesManagementProps {
    onStrikeRemoved?: () => void;
}

interface User {
    id: string;
    name?: string;
    email: string;
}

interface UsersResponse {
    success: boolean;
    data: {
        users: User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export function StrikesManagement({ onStrikeRemoved }: StrikesManagementProps) {
    const [strikes, setStrikes] = useState<(Strike & { userName: string })[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStrikes = async () => {
        try {
            // Get all users first - set a high limit to get all users
            const response = await api.get('/users?limit=1000')

            // Log the response for debugging
            console.log('Users API Response:', response)

            // Check if we have a valid response
            if (!response?.data?.success) {
                throw new Error('Failed to fetch users data')
            }

            const users = response.data.data.users
            if (!Array.isArray(users)) {
                throw new Error('Invalid users data format')
            }

            // Get all strikes for each user
            const allStrikes: (Strike & { userName: string })[] = []
            users.forEach((user: User) => {
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

    if (loading) {
        return <div>Loading strikes...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Strikes Management</CardTitle>
                <CardDescription>View and manage strikes for all team members.</CardDescription>
            </CardHeader>
            <CardContent>
                {strikes.length === 0 ? (
                    <p className="text-muted-foreground">No strikes found.</p>
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
                                    <TableCell>{strike.reason}</TableCell>
                                    <TableCell>{new Date(strike.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{strike.issuedBy}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveStrike(strike.id)}
                                        >
                                            Remove Strike
                                        </Button>
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