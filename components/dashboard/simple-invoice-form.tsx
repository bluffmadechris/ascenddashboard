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

// Import the data persistence utility
import { loadData, saveData } from "@/lib/data-persistence"

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
  const [initialStatus, setInitialStatus] = useState("new")

  // Items and calculations
  const [items, setItems] = useState<InvoiceItem[]>([{ id: uuidv4(), description: "", quantity: 1, amount: 0 }])
  const [total, setTotal] = useState(0)

  // Check if user is owner
  const { user: authUser } = useAuth()
  const isOwner = authUser?.role === "owner"

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

    if (!selectedClient && !selectedClientName) {
      toast({
        title: "Missing client",
        description: "Please select a client for this invoice.",
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

    // Generate a payrun ID
    const payrunId = `PR-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`

    // Create invoice object
    const invoice = {
      id: payrunId,
      name: invoiceName,
      clientId: selectedClient || "custom-client",
      clientName: selectedClientName || "Custom Client",
      date: invoiceDate,
      items,
      total: items.reduce((sum, item) => sum + item.amount, 0),
      status: initialStatus, // Use the selected status
      createdBy: user?.id || "",
      createdByName: user?.name || "Unknown User",
      createdAt: new Date(),
    }

    // In a real app, you would save this to a database
    // For now, we'll simulate an API call with a timeout
    setTimeout(() => {
      // Add to localStorage for demo purposes
      const existingInvoices = loadData("invoices", [])
      saveData("invoices", [...existingInvoices, invoice])

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
      setInitialStatus("new")
      setItems([{ id: uuidv4(), description: "", quantity: 1, amount: 0 }])

      // Call the callback if provided
      if (onInvoiceCreated) {
        onInvoiceCreated()
      }
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground",
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

              <div className="space-y-2">
                <Label htmlFor="invoice-name">Invoice Name</Label>
                <Input
                  id="invoice-name"
                  value={invoiceName}
                  onChange={(e) => setInvoiceName(e.target.value)}
                  placeholder="e.g., Monthly Services"
                  required
                />
              </div>
            </div>

            {!clientId && (
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={selectedClient}
                  onValueChange={(value) => {
                    setSelectedClient(value)
                    const clientMap: Record<string, string> = {
                      capri: "Capri",
                      "piper-rockelle": "Piper Rockelle",
                      paryeet: "Paryeet",
                      "lacy-vods": "Lacy VODS",
                      "custom-client": "Custom Client",
                    }
                    setSelectedClientName(clientMap[value] || "")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capri">Capri</SelectItem>
                    <SelectItem value="piper-rockelle">Piper Rockelle</SelectItem>
                    <SelectItem value="paryeet">Paryeet</SelectItem>
                    <SelectItem value="lacy-vods">Lacy VODS</SelectItem>
                    <SelectItem value="custom-client">Custom Client</SelectItem>
                  </SelectContent>
                </Select>
                {selectedClient === "custom-client" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter client name"
                      value={selectedClientName}
                      onChange={(e) => setSelectedClientName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {isOwner && (
              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select value={initialStatus} onValueChange={setInitialStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Invoice Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-10 gap-2 items-start">
                  <div className="col-span-5">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[index].description = e.target.value
                        setItems(newItems)
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = Number.parseInt(e.target.value) || 0
                        const newItems = [...items]
                        // Store the unit price (amount per single item)
                        const unitPrice = item.quantity > 0 ? item.amount / item.quantity : item.amount
                        // Update quantity
                        newItems[index].quantity = qty
                        // Calculate new total amount based on quantity * unit price
                        newItems[index].amount = qty * unitPrice
                        setItems(newItems)
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => {
                        const amount = Number.parseFloat(e.target.value) || 0
                        const newItems = [...items]
                        newItems[index].amount = amount
                        setItems(newItems)
                      }}
                      className="pl-6 relative"
                    />
                    <span className="absolute translate-y-[-30px] translate-x-2">$</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-1/3">
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>${items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</span>
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
