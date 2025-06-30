"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { loadData, saveData } from "@/lib/data-persistence"
import { PlusCircle, Edit, Save, X, ChevronDown, ChevronUp } from "lucide-react"

// Define types for monthly revenue data
export type MonthlyRevenue = {
  month: string // Format: YYYY-MM
  amount: number
  notes?: string
}

export type ClientMonthlyRevenue = {
  clientId: string
  revenues: MonthlyRevenue[]
}

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// Helper function to format month for display
const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

// Generate last 12 months in YYYY-MM format
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

interface MonthlyRevenueManagerProps {
  clientId: string
  clientName: string
  onRevenueUpdated: () => void
}

export function MonthlyRevenueManager({ clientId, clientName, onRevenueUpdated }: MonthlyRevenueManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([])

  // Form state
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  // Load monthly revenue data
  useEffect(() => {
    const loadMonthlyRevenues = () => {
      try {
        const data = loadData<ClientMonthlyRevenue[]>("monthlyRevenues", [])

        // Ensure data is an array
        const allClientRevenues = Array.isArray(data) ? data : []

        const clientRevenues = allClientRevenues.find((cr) => cr.clientId === clientId)

        if (clientRevenues) {
          // Sort by month (newest first)
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

    // Listen for storage events
    window.addEventListener("storage", loadMonthlyRevenues)
    return () => {
      window.removeEventListener("storage", loadMonthlyRevenues)
    }
  }, [clientId])

  // Save monthly revenue data
  const saveMonthlyRevenue = (newRevenue: MonthlyRevenue) => {
    try {
      const data = loadData<ClientMonthlyRevenue[]>("monthlyRevenues", [])

      // Ensure data is an array
      const allClientRevenues = Array.isArray(data) ? data : []

      // Find client's revenue data
      const clientIndex = allClientRevenues.findIndex((cr) => cr.clientId === clientId)

      if (clientIndex >= 0) {
        // Client exists, update or add the monthly revenue
        const clientRevenues = allClientRevenues[clientIndex]
        const monthIndex = clientRevenues.revenues.findIndex((r) => r.month === newRevenue.month)

        if (monthIndex >= 0) {
          // Update existing month
          clientRevenues.revenues[monthIndex] = newRevenue
        } else {
          // Add new month
          clientRevenues.revenues.push(newRevenue)
        }

        allClientRevenues[clientIndex] = clientRevenues
      } else {
        // Client doesn't exist, create new entry
        allClientRevenues.push({
          clientId,
          revenues: [newRevenue],
        })
      }

      // Save updated data
      saveData("monthlyRevenues", allClientRevenues)

      // Update local state
      setMonthlyRevenues((prev) => {
        const updated = [...prev]
        const monthIndex = updated.findIndex((r) => r.month === newRevenue.month)

        if (monthIndex >= 0) {
          updated[monthIndex] = newRevenue
        } else {
          updated.push(newRevenue)
        }

        // Sort by month (newest first)
        return updated.sort((a, b) => b.month.localeCompare(a.month))
      })

      // Notify parent component
      onRevenueUpdated()

      return true
    } catch (error) {
      console.error("Error saving monthly revenue:", error)
      return false
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate input
    if (!selectedMonth || !amount || isNaN(Number.parseFloat(amount))) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid month and amount",
        variant: "destructive",
      })
      return
    }

    // Create new revenue entry
    const newRevenue: MonthlyRevenue = {
      month: selectedMonth,
      amount: Number.parseFloat(amount),
      notes: notes.trim() || undefined,
    }

    // Save the data
    const success = saveMonthlyRevenue(newRevenue)

    if (success) {
      toast({
        title: "Revenue updated",
        description: `Revenue for ${formatMonth(selectedMonth)} has been updated.`,
      })

      // Reset form
      setIsAddingNew(false)
      setIsEditing(null)
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

  // Start editing a specific month
  const handleEdit = (revenue: MonthlyRevenue) => {
    setIsEditing(revenue.month)
    setSelectedMonth(revenue.month)
    setAmount(revenue.amount.toString())
    setNotes(revenue.notes || "")
  }

  // Cancel editing
  const handleCancel = () => {
    setIsAddingNew(false)
    setIsEditing(null)
    setSelectedMonth(getCurrentMonth())
    setAmount("")
    setNotes("")
  }

  // Calculate total revenue
  const totalRevenue = monthlyRevenues.reduce((sum, revenue) => sum + revenue.amount, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Track and update monthly revenue for {clientName}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {/* Summary */}
          <div className="mb-4">
            <p className="text-sm font-medium">
              Total Revenue: <span className="font-bold">${totalRevenue.toFixed(2)}</span>
            </p>
            <p className="text-xs text-muted-foreground">Based on {monthlyRevenues.length} months of data</p>
          </div>

          {/* Add/Edit Form */}
          {(isAddingNew || isEditing) && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-md bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isEditing !== null}>
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
                <Button type="button" variant="outline" onClick={handleCancel}>
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

          {/* Revenue Table */}
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
                    className={`grid grid-cols-12 gap-2 p-3 text-sm ${isEditing === revenue.month ? "bg-muted/20" : ""}`}
                  >
                    <div className="col-span-4">{formatMonth(revenue.month)}</div>
                    <div className="col-span-3">${revenue.amount.toFixed(2)}</div>
                    <div className="col-span-3 truncate" title={revenue.notes}>
                      {revenue.notes || "-"}
                    </div>
                    <div className="col-span-2 text-right">
                      {isEditing !== revenue.month && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(revenue)}
                          disabled={isEditing !== null || isAddingNew}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">No monthly revenue data available.</div>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          {isExpanded ? `Showing ${monthlyRevenues.length} months` : "Click to expand"}
        </p>

        {isExpanded && !isAddingNew && !isEditing && (
          <Button onClick={() => setIsAddingNew(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Month
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
