"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { v4 as uuidv4 } from "@/lib/uuid"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  amount: number
}

export function SimpleInvoiceForm({
  clientId,
  clientName,
  onInvoiceCreated,
}: {
  clientId?: string
  clientName?: string
  onInvoiceCreated?: () => void
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Invoice details
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [invoiceName, setInvoiceName] = useState("")
  const [selectedClient, setSelectedClient] = useState(clientId || "")
  const [selectedClientName, setSelectedClientName] = useState(clientName || "")
  const [initialStatus, setInitialStatus] = useState("draft")

  // Items and calculations
  const [items, setItems] = useState<InvoiceItem[]>([{ id: uuidv4(), description: "", quantity: 1, amount: 0 }])
  const [total, setTotal] = useState(0)

  // Check if user is owner
  const { user: authUser } = useAuth()
  const isOwner = authUser?.role === "owner"

  // Set default status to draft for non-owners
  useEffect(() => {
    if (!isOwner) {
      setInitialStatus("draft")
    }
  }, [isOwner])

  // Calculate total
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.amount, 0)
    setTotal(newTotal)
  }, [items])

  // Add a new item
  const addItem = () => {
    setItems([...items, { id: uuidv4(), description: "", quantity: 1, amount: 0 }])
  }

  // Remove an item
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    } else {
      toast({
        title: "Cannot remove item",
        description: "An invoice must have at least one item.",
        variant: "destructive",
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate form
    if (!invoiceName) {
      toast({
        title: "Missing invoice name",
        description: "Please provide a name for this invoice.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (items.some((item) => !item.description || item.quantity <= 0)) {
      toast({
        title: "Invalid items",
        description: "Please ensure all items have a description and quantity.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Generate a unique invoice number
    const invoiceNumber = `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`

    try {
      // Create invoice data for the API
      const invoiceData = {
        client_id: selectedClient || null, // Make sure it's null if no client selected
        invoice_number: invoiceNumber,
        amount: total,
        currency: "USD",
        status: initialStatus,
        issue_date: invoiceDate.toISOString().split('T')[0],
        due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from issue
        description: invoiceName,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          amount: item.amount
        }))
      }

      // Send to API
      const response = await apiClient.createInvoice(invoiceData)

      if (!response.success) {
        throw new Error(response.message || 'Failed to create invoice')
      }

      setIsLoading(false)
      setOpen(false)

      toast({
        title: "Invoice created",
        description: `Invoice "${invoiceName}" has been created successfully.`,
      })

      // Reset form
      setInvoiceName("")
      setSelectedClient(clientId || "")
      setSelectedClientName(clientName || "")
      setInitialStatus("draft")
      setItems([{ id: uuidv4(), description: "", quantity: 1, amount: 0 }])

      // Call the callback if provided
      if (onInvoiceCreated) {
        onInvoiceCreated()
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setIsLoading(false)
      toast({
        title: "Error creating invoice",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceName">Invoice Name</Label>
              <Input
                id="invoiceName"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                placeholder="Enter invoice name"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !invoiceDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={invoiceDate} onSelect={(date) => date && setInvoiceDate(date)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isOwner && (
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <Select value={initialStatus} onValueChange={setInitialStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-end">
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) =>
                      setItems(
                        items.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i)),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, quantity: parseInt(e.target.value) || 0 } : i,
                        ),
                      )
                    }
                    className="w-24"
                  />
                </div>
                <div>
                  <Label htmlFor={`amount-${index}`}>Amount</Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) =>
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, amount: parseFloat(e.target.value) || 0 } : i,
                        ),
                      )
                    }
                    className="w-24"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="mb-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center font-medium">
            <span>Total Amount:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
