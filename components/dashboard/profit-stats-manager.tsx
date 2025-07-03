"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Pencil, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type ProfitStat = {
    id: number
    amount: number
    month: string
    notes: string
    created_by_name: string
    created_at: string
    updated_at: string
}

interface ProfitStats {
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    currentMonthProfit: number;
    previousMonthProfit: number;
    revenueGrowth: number;
    profitGrowth: number;
}

export function ProfitStatsManager() {
    const { toast } = useToast()
    const [profitStats, setProfitStats] = useState<ProfitStat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedStat, setSelectedStat] = useState<ProfitStat | null>(null)
    const [stats, setStats] = useState<ProfitStats>({
        currentMonthRevenue: 0,
        previousMonthRevenue: 0,
        currentMonthProfit: 0,
        previousMonthProfit: 0,
        revenueGrowth: 0,
        profitGrowth: 0
    })

    // Form state
    const [amount, setAmount] = useState("")
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
    const [notes, setNotes] = useState("")

    // Fetch profit stats
    const fetchProfitStats = async () => {
        try {
            const response = await apiClient.get('/dashboard/profit-stats')
            if (response.success) {
                setProfitStats(response.data.profit_stats)
            }
        } catch (error) {
            console.error('Error fetching profit stats:', error)
            toast("Failed to fetch profit stats", { description: "", className: "text-destructive" })
        }
    }

    useEffect(() => {
        fetchProfitStats()
    }, [])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/owner/profit-stats')
                // Ensure all numeric values are properly converted to numbers
                const data = {
                    currentMonthRevenue: Number(response.data.currentMonthRevenue) || 0,
                    previousMonthRevenue: Number(response.data.previousMonthRevenue) || 0,
                    currentMonthProfit: Number(response.data.currentMonthProfit) || 0,
                    previousMonthProfit: Number(response.data.previousMonthProfit) || 0,
                    revenueGrowth: Number(response.data.revenueGrowth) || 0,
                    profitGrowth: Number(response.data.profitGrowth) || 0
                }
                setStats(data)
                setIsLoading(false)
            } catch (error) {
                toast("Failed to fetch profit statistics", { description: "", className: "text-destructive" })
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    // Reset form
    const resetForm = () => {
        setAmount("")
        setSelectedMonth(new Date())
        setNotes("")
        setSelectedStat(null)
    }

    // Handle create
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await apiClient.post('/dashboard/profit-stats', {
                amount: parseFloat(amount),
                month: selectedMonth.toISOString().split('T')[0],
                notes
            })

            if (response.success) {
                toast("Profit stat created successfully")
                fetchProfitStats()
                setIsAddDialogOpen(false)
                resetForm()
            }
        } catch (error) {
            console.error('Error creating profit stat:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create profit stat",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle edit
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStat) return
        setIsLoading(true)

        try {
            const response = await apiClient.put(`/dashboard/profit-stats/${selectedStat.id}`, {
                amount: parseFloat(amount),
                month: selectedMonth.toISOString().split('T')[0],
                notes
            })

            if (response.success) {
                toast("Profit stat updated successfully")
                fetchProfitStats()
                setIsEditDialogOpen(false)
                resetForm()
            }
        } catch (error) {
            console.error('Error updating profit stat:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profit stat",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle delete
    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this profit stat?')) return
        setIsLoading(true)

        try {
            const response = await apiClient.delete(`/dashboard/profit-stats/${id}`)
            if (response.success) {
                toast("Profit stat deleted successfully")
                fetchProfitStats()
            }
        } catch (error) {
            console.error('Error deleting profit stat:', error)
            toast({
                title: "Error",
                description: "Failed to delete profit stat",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Open edit dialog
    const openEditDialog = (stat: ProfitStat) => {
        setSelectedStat(stat)
        setAmount(stat.amount.toString())
        setSelectedMonth(new Date(stat.month))
        setNotes(stat.notes || "")
        setIsEditDialogOpen(true)
    }

    // Helper function to format currency
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value)
    }

    // Helper function to format percentage
    const formatPercentage = (value: number): string => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profit Stats</CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Add Profit Stat</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Profit Stat</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !selectedMonth && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>Pick a month</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedMonth}
                                            onSelect={(date) => date && setSelectedMonth(date)}
                                            disabled={(date) => date > new Date() || date < new Date(2020, 0)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter notes (optional)"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Profit Stat"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {profitStats.map((stat) => (
                        <div
                            key={stat.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div>
                                <div className="font-medium">${Number(stat.amount).toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">
                                    {format(new Date(stat.month), "MMMM yyyy")}
                                </div>
                                {stat.notes && (
                                    <div className="text-sm mt-1">{stat.notes}</div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                    Added by {stat.created_by_name}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openEditDialog(stat)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDelete(stat.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {profitStats.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            No profit stats yet. Add one to get started.
                        </div>
                    )}
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Profit Stat</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !selectedMonth && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>Pick a month</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedMonth}
                                            onSelect={(date) => date && setSelectedMonth(date)}
                                            disabled={(date) => date > new Date() || date < new Date(2020, 0)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-notes">Notes</Label>
                                <Textarea
                                    id="edit-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter notes (optional)"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Profit Stat"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
} 