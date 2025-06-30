"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { loadData, saveData } from "@/lib/data-persistence"
import { DollarSign, Plus } from "lucide-react"

interface MonthlyRevenueProps {
    clientId: string
}

type MonthlyRevenue = {
    month: string // Format: YYYY-MM
    amount: number
}

export function MonthlyRevenue({ clientId }: MonthlyRevenueProps) {
    const { toast } = useToast()
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
    const [newMonth, setNewMonth] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [loading, setLoading] = useState(true)

    // Load monthly revenue data
    useEffect(() => {
        const loadMonthlyRevenue = () => {
            try {
                const clients = loadData("clients", [])
                const client = clients.find((c: any) => c.id === clientId)

                if (client && client.monthlyRevenue) {
                    setMonthlyRevenue(client.monthlyRevenue)
                }
            } catch (error) {
                console.error("Error loading monthly revenue:", error)
            } finally {
                setLoading(false)
            }
        }

        loadMonthlyRevenue()

        // Listen for storage events
        const handleStorageChange = () => {
            loadMonthlyRevenue()
        }

        window.addEventListener("storage", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [clientId])

    // Get available months for the select dropdown
    const getAvailableMonths = () => {
        const months = []
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth()

        // Add months for current year and previous year
        for (let year = currentYear; year >= currentYear - 1; year--) {
            for (let month = 11; month >= 0; month--) {
                // Skip future months
                if (year === currentYear && month > currentMonth) continue

                const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`
                if (!monthlyRevenue.some(rev => rev.month === monthStr)) {
                    months.push(monthStr)
                }
            }
        }

        return months
    }

    // Format month for display
    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split("-")
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long"
        })
    }

    // Add new monthly revenue
    const handleAddRevenue = () => {
        if (!newMonth || !newAmount) {
            toast({
                title: "Missing information",
                description: "Please select a month and enter an amount.",
                variant: "destructive",
            })
            return
        }

        const amount = parseFloat(newAmount)
        if (isNaN(amount) || amount < 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid positive number.",
                variant: "destructive",
            })
            return
        }

        try {
            // Add new monthly revenue
            const newRevenue = [...monthlyRevenue, { month: newMonth, amount }]
            setMonthlyRevenue(newRevenue)

            // Update client data
            const clients = loadData("clients", [])
            const updatedClients = clients.map((client: any) => {
                if (client.id === clientId) {
                    return {
                        ...client,
                        monthlyRevenue: newRevenue,
                        revenue: newRevenue.reduce((sum: number, rev: MonthlyRevenue) => sum + rev.amount, 0)
                    }
                }
                return client
            })
            saveData("clients", updatedClients)

            // Reset form
            setNewMonth("")
            setNewAmount("")

            // Show success message
            toast({
                title: "Revenue added",
                description: `Added $${amount.toFixed(2)} for ${formatMonth(newMonth)}.`,
            })

            // Trigger storage event to update other components
            window.dispatchEvent(new Event("storage"))
        } catch (error) {
            console.error("Error adding revenue:", error)
            toast({
                title: "Error",
                description: "Failed to add revenue. Please try again.",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Add new revenue form */}
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <Select value={newMonth} onValueChange={setNewMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableMonths().map((month) => (
                                        <SelectItem key={month} value={month}>
                                            {formatMonth(month)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <Button onClick={handleAddRevenue}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Revenue
                        </Button>
                    </div>

                    {/* Revenue list */}
                    <div className="space-y-2">
                        {monthlyRevenue
                            .sort((a, b) => b.month.localeCompare(a.month))
                            .map((revenue) => (
                                <div
                                    key={revenue.month}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <span className="font-medium">{formatMonth(revenue.month)}</span>
                                    <span className="text-muted-foreground">${revenue.amount.toFixed(2)}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 