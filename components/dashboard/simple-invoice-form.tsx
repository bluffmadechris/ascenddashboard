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
import { toast } from "sonner"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface SimpleInvoiceFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function SimpleInvoiceForm({ onSubmit, initialData }: SimpleInvoiceFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Invoice details
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [invoiceName, setInvoiceName] = useState("")
  const [initialStatus, setInitialStatus] = useState("draft")

  // Items and calculations
  const [items, setItems] = useState<InvoiceItem[]>([{ id: uuidv4(), description: "", quantity: 1, rate: 0, amount: 0 }])
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

  // Calculate total and item amounts
  const calculateAmount = (quantity: number, rate: number) => {
    return Number((quantity * rate).toFixed(2))
  }

  // Update item amounts when quantity or rate changes
  const updateItemAmount = (id: string, quantity: number, rate: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          rate,
          amount: calculateAmount(quantity, rate)
        }
      }
      return item
    }))
  }

  // Calculate total whenever items change
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.amount, 0)
    setTotal(Number(newTotal.toFixed(2)))
  }, [items])

  // Add a new item
  const addItem = () => {
    setItems([...items, { id: uuidv4(), description: "", quantity: 1, rate: 0, amount: 0 }])
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
        invoice_number: invoiceNumber,
        amount: total,
        currency: "USD",
        status: initialStatus,
        issue_date: invoiceDate.toISOString().split('T')[0],
        due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from issue
        description: invoiceName,
        created_by_name: user?.name || "Unknown",
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))
      }

      // Send to API
      const response = await apiClient.createInvoice(invoiceData)

      if (!response.success) {
        throw new Error(response.message || 'Failed to create invoice')
      }

      // Send notifications if invoice is approved or paid
      if (initialStatus === "approved") {
        await apiClient.createNotification({
          type: "INVOICE_APPROVED",
          title: "Invoice Approved",
          message: `Invoice ${invoiceNumber} has been approved.`,
          data: { invoiceId: response.data.id }
        })
      } else if (initialStatus === "paid") {
        await apiClient.createNotification({
          type: "INVOICE_PAID",
          title: "Invoice Paid",
          message: `Invoice ${invoiceNumber} has been marked as paid.`,
          data: { invoiceId: response.data.id }
        })
      }

      setIsLoading(false)
      setOpen(false)

      toast({
        title: "Invoice created",
        description: `Invoice "${invoiceName}" has been created successfully.`,
      })

      // Reset form
      setInvoiceName("")
      setInitialStatus("draft")
      setItems([{ id: uuidv4(), description: "", quantity: 1, rate: 0, amount: 0 }])

      // Call the callback if provided
      if (onSubmit) {
        onSubmit(response.data)
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

  const handleStatusChange = async (newStatus: string) => {
    if (!initialData?.id) return;

    try {
      await apiClient.put(`/invoices/status/${initialData.id}`, { status: newStatus });
      setInitialStatus(newStatus);
      toast.success("Invoice status updated");
    } catch (error) {
      toast.error("Failed to update invoice status");
    }
  };

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
            <div>
              <Label htmlFor="invoiceName">Invoice Name</Label>
              <Input
                id="invoiceName"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                placeholder="Enter invoice name"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={(date) => date && setInvoiceDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {isOwner && (
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <Select value={initialStatus} onValueChange={handleStatusChange}>
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
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, description: e.target.value } : i
                        )
                      )
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const quantity = Number(e.target.value)
                      updateItemAmount(item.id, quantity, item.rate)
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => {
                      const rate = Number(e.target.value)
                      updateItemAmount(item.id, item.quantity, rate)
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    readOnly
                    value={item.amount.toFixed(2)}
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 text-right">
            <div>
              <div className="mb-2">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="ml-2">${total.toFixed(2)}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-muted-foreground">Tax (0%):</span>
                <span className="ml-2">$0.00</span>
              </div>
              <div>
                <span className="font-medium">Total:</span>
                <span className="ml-2">${total.toFixed(2)}</span>
              </div>
            </div>
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
