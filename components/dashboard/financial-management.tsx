"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { loadData, saveData } from "@/lib/data-persistence"
import {
    PlusCircle,
    Edit,
    Save,
    X,
    ChevronDown,
    ChevronUp,
    DollarSign,
    FileText,
    TrendingUp,
    Users,
    Calendar
} from "lucide-react"
import { SimpleInvoicesList } from "./simple-invoices-list"
import { generateId } from "@/lib/uuid"

// Types
export type MonthlyRevenue = {
    month: string // Format: YYYY-MM
    amount: number
    notes?: string
}

export type ClientMonthlyRevenue = {
    clientId: string
    revenues: MonthlyRevenue[]
}

type SimpleInvoice = {
    id: string
    name: string
    clientId: string
    clientName: string
    date: Date
    total: number
    status: string
    createdBy: string
    createdByName: string
    createdAt: Date
}

type Client = {
    id: string
    name: string
    logo: string
    industry: string
    status: string
    contactPerson: string
    contactEmail: string
}

// Helper functions
const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

const getLast12Months = () => {
    const months = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
        months.push(monthStr)
    }

    return months
}

export function FinancialManagement() {
    const [selectedClient, setSelectedClient] = useState<string>("")
    const [clients, setClients] = useState<Client[]>([])
    const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([])
    const [isExpanded, setIsExpanded] = useState(false)
    const [isAddingRevenue, setIsAddingRevenue] = useState(false)
    const [isEditingRevenue, setIsEditingRevenue] = useState<string | null>(null)
    const [isAddingInvoice, setIsAddingInvoice] = useState(false)

    // Revenue form state
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
    const [amount, setAmount] = useState("")
    const [notes, setNotes] = useState("")

    // Invoice form state
    const [invoiceName, setInvoiceName] = useState("")
    const [invoiceAmount, setInvoiceAmount] = useState("")
    const [invoiceStatus, setInvoiceStatus] = useState("pending")

    // Load clients
    useEffect(() => {
        const loadClients = () => {
            try {
                const storedClients = loadData<Record<string, Client>>("clients", {})
                const clientsArray = Array.isArray(storedClients) ? storedClients : Object.values(storedClients)
                setClients(clientsArray)
            } catch (error) {
                console.error("Error loading clients:", error)
                setClients([])
            }
        }

        loadClients()
    }, [])

    // Load monthly revenues for selected client
    useEffect(() => {
        if (!selectedClient) {
            setMonthlyRevenues([])
            return
        }

        const loadMonthlyRevenues = () => {
            try {
                const data = loadData<ClientMonthlyRevenue[]>("monthlyRevenues", [])
                const allClientRevenues = Array.isArray(data) ? data : []
                const clientRevenues = allClientRevenues.find((cr) => cr.clientId === selectedClient)

                if (clientRevenues) {
                    const sortedRevenues = [...clientRevenues.revenues].sort((a, b) => b.month.localeCompare(a.month))
                    setMonthlyRevenues(sortedRevenues)
                } else {
                    setMonthlyRevenues([])
                }
            } catch (error) {
                console.error("Error loading monthly revenues:", error)
                setMonthlyRevenues([])
            }
        }

        loadMonthlyRevenues()
    }, [selectedClient])

    // Save monthly revenue
    const saveMonthlyRevenue = (newRevenue: MonthlyRevenue) => {
        if (!selectedClient) return false

        try {
            const data = loadData<ClientMonthlyRevenue[]>("monthlyRevenues", [])
            const allClientRevenues = Array.isArray(data) ? data : []
            const clientIndex = allClientRevenues.findIndex((cr) => cr.clientId === selectedClient)

            if (clientIndex >= 0) {
                const clientRevenues = allClientRevenues[clientIndex]
                const monthIndex = clientRevenues.revenues.findIndex((r) => r.month === newRevenue.month)

                if (monthIndex >= 0) {
                    clientRevenues.revenues[monthIndex] = newRevenue
                } else {
                    clientRevenues.revenues.push(newRevenue)
                }

                allClientRevenues[clientIndex] = clientRevenues
            } else {
                allClientRevenues.push({
                    clientId: selectedClient,
                    revenues: [newRevenue],
                })
            }

            saveData("monthlyRevenues", allClientRevenues)

            setMonthlyRevenues((prev) => {
                const updated = [...prev]
                const monthIndex = updated.findIndex((r) => r.month === newRevenue.month)

                if (monthIndex >= 0) {
                    updated[monthIndex] = newRevenue
                } else {
                    updated.push(newRevenue)
                }

                return updated.sort((a, b) => b.month.localeCompare(a.month))
            })

            return true
        } catch (error) {
            console.error("Error saving monthly revenue:", error)
            return false
        }
    }

    // Handle revenue form submission
    const handleRevenueSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedClient) {
            toast({
                title: "No client selected",
                description: "Please select a client first",
                variant: "destructive",
            })
            return
        }

        if (!selectedMonth || !amount || isNaN(Number.parseFloat(amount))) {
            toast({
                title: "Invalid input",
                description: "Please enter a valid month and amount",
                variant: "destructive",
            })
            return
        }

        const newRevenue: MonthlyRevenue = {
            month: selectedMonth,
            amount: Number.parseFloat(amount),
            notes: notes.trim() || undefined,
        }

        const success = saveMonthlyRevenue(newRevenue)

        if (success) {
            toast({
                title: "Revenue updated",
                description: `Revenue for ${formatMonth(selectedMonth)} has been updated.`,
            })

            setIsAddingRevenue(false)
            setIsEditingRevenue(null)
            setSelectedMonth(getCurrentMonth())
            setAmount("")
            setNotes("")
        } else {
            toast({
                title: "Error",
                description: "Failed to update revenue. Please try again.",
                variant: "destructive",
            })
        }
    }

    // Handle invoice creation
    const handleInvoiceSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedClient) {
            toast({
                title: "No client selected",
                description: "Please select a client first",
                variant: "destructive",
            })
            return
        }

        if (!invoiceName || !invoiceAmount || isNaN(Number.parseFloat(invoiceAmount))) {
            toast({
                title: "Invalid input",
                description: "Please enter valid invoice details",
                variant: "destructive",
            })
            return
        }

        const selectedClientData = clients.find(c => c.id === selectedClient)

        const newInvoice: SimpleInvoice = {
            id: generateId(),
            name: invoiceName,
            clientId: selectedClient,
            clientName: selectedClientData?.name || "Unknown Client",
            date: new Date(),
            total: Number.parseFloat(invoiceAmount),
            status: invoiceStatus,
            createdBy: "current-user", // This should be the actual user ID
            createdByName: "Current User", // This should be the actual user name
            createdAt: new Date(),
        }

        try {
            const allInvoices = loadData<SimpleInvoice[]>("invoices", [])
            allInvoices.push(newInvoice)
            saveData("invoices", allInvoices)

            toast({
                title: "Invoice created",
                description: `Invoice "${invoiceName}" has been created successfully.`,
            })

            setIsAddingInvoice(false)
            setInvoiceName("")
            setInvoiceAmount("")
            setInvoiceStatus("pending")
        } catch (error) {
            console.error("Error creating invoice:", error)
            toast({
                title: "Error",
                description: "Failed to create invoice. Please try again.",
                variant: "destructive",
            })
        }
    }

    // Start editing a revenue entry
    const handleEditRevenue = (revenue: MonthlyRevenue) => {
        setIsEditingRevenue(revenue.month)
        setSelectedMonth(revenue.month)
        setAmount(revenue.amount.toString())
        setNotes(revenue.notes || "")
    }

    // Cancel forms
    const handleCancelRevenue = () => {
        setIsAddingRevenue(false)
        setIsEditingRevenue(null)
        setSelectedMonth(getCurrentMonth())
        setAmount("")
        setNotes("")
    }

    const totalRevenue = monthlyRevenues.reduce((sum, revenue) => sum + revenue.amount, 0)
    const selectedClientData = clients.find(c => c.id === selectedClient)

    return (
        <div className="space-y-6">
            {/* Client Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Financial Management
                    </CardTitle>
                    <CardDescription>Manage monthly revenue and invoices for your clients</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="client-select">Select Client / Creator</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder="Choose a client to manage..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedClient && (
                <Tabs defaultValue="revenue" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="revenue">Monthly Revenue</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    </TabsList>

                    <TabsContent value="revenue" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Monthly Revenue - {selectedClientData?.name}</CardTitle>
                                    <CardDescription>Track and update monthly revenue</CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent>
                                    <div className="mb-4">
                                        <p className="text-sm font-medium">
                                            Total Revenue: <span className="font-bold">${totalRevenue.toFixed(2)}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">Based on {monthlyRevenues.length} months of data</p>
                                    </div>

                                    {(isAddingRevenue || isEditingRevenue) && (
                                        <form onSubmit={handleRevenueSubmit} className="space-y-4 mb-6 p-4 border rounded-md bg-muted/20">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="month">Month</Label>
                                                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isEditingRevenue !== null}>
                                                        <SelectTrigger id="month">
                                                            <SelectValue placeholder="Select month" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getLast12Months().map((month) => (
                                                                <SelectItem key={month} value={month}>
                                                                    {formatMonth(month)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="amount">Amount ($)</Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="notes">Notes (Optional)</Label>
                                                <Input
                                                    id="notes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Add any notes about this revenue"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2">
                                                <Button type="button" variant="outline" onClick={handleCancelRevenue}>
                                                    <X className="mr-2 h-4 w-4" />
                                                    Cancel
                                                </Button>
                                                <Button type="submit">
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save
                                                </Button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="rounded-md border">
                                        <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                                            <div className="col-span-4">Month</div>
                                            <div className="col-span-3">Amount</div>
                                            <div className="col-span-3">Notes</div>
                                            <div className="col-span-2 text-right">Actions</div>
                                        </div>

                                        {monthlyRevenues.length > 0 ? (
                                            <div className="divide-y">
                                                {monthlyRevenues.map((revenue) => (
                                                    <div
                                                        key={revenue.month}
                                                        className={`grid grid-cols-12 gap-2 p-3 text-sm ${isEditingRevenue === revenue.month ? "bg-muted/20" : ""}`}
                                                    >
                                                        <div className="col-span-4">{formatMonth(revenue.month)}</div>
                                                        <div className="col-span-3">${revenue.amount.toFixed(2)}</div>
                                                        <div className="col-span-3 truncate" title={revenue.notes}>
                                                            {revenue.notes || "-"}
                                                        </div>
                                                        <div className="col-span-2 text-right">
                                                            {isEditingRevenue !== revenue.month && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditRevenue(revenue)}
                                                                    disabled={isEditingRevenue !== null || isAddingRevenue}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No monthly revenue data available.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}

                            <div className="flex justify-between p-6 pt-0">
                                <p className="text-sm text-muted-foreground">
                                    {isExpanded ? `Showing ${monthlyRevenues.length} months` : "Click to expand"}
                                </p>

                                {isExpanded && !isAddingRevenue && !isEditingRevenue && (
                                    <Button onClick={() => setIsAddingRevenue(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Monthly Income
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invoices" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Client Invoices - {selectedClientData?.name}</CardTitle>
                                    <CardDescription>View and manage all invoices</CardDescription>
                                </div>
                                <Button onClick={() => setIsAddingInvoice(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Invoice
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <SimpleInvoicesList clientId={selectedClient} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Invoice Creation Dialog */}
            <Dialog open={isAddingInvoice} onOpenChange={setIsAddingInvoice}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                        <DialogDescription>
                            Create a new invoice for {selectedClientData?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice-name">Invoice Name</Label>
                            <Input
                                id="invoice-name"
                                value={invoiceName}
                                onChange={(e) => setInvoiceName(e.target.value)}
                                placeholder="Enter invoice name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-amount">Amount ($)</Label>
                            <Input
                                id="invoice-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={invoiceAmount}
                                onChange={(e) => setInvoiceAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-status">Status</Label>
                            <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                                <SelectTrigger id="invoice-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddingInvoice(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Create Invoice
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
} 