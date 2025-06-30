"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Trash2, CheckCircle, Clock, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

// Import the data persistence utility
import { loadData, saveData } from "@/lib/data-persistence"
import { generateInvoicePDF } from "@/lib/pdf-generator"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

type SimpleInvoice = {
  id: string
  name: string
  clientId: string
  clientName: string
  date: Date
  items: InvoiceItem[]
  total: number
  status: string
  createdBy: string
  createdByName: string
  createdAt: Date
}

type FilterOptions = {
  status?: string
  createdBy?: string
}

export function SimpleInvoicesList({
  clientId,
  limit,
  filterBy,
}: {
  clientId?: string
  limit?: number
  filterBy?: FilterOptions
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Check if the user is an owner (any owner, not just specific email)
  const isOwner = user?.role === "owner"

  // One-time initialization to convert legacy statuses
  useEffect(() => {
    if (initialized) return

    try {
      const allInvoices = loadData("invoices", [])
      if (!allInvoices || !Array.isArray(allInvoices) || allInvoices.length === 0) {
        setInitialized(true)
        return
      }

      // Check if we need to convert any legacy statuses
      let needsUpdate = false
      const updatedInvoices = allInvoices.map((invoice: SimpleInvoice) => {
        // Convert "pending" to "new" if it exists
        if (invoice.status === "pending") {
          needsUpdate = true
          return { ...invoice, status: "new" }
        }
        // If status is missing or invalid, set it to "new"
        if (!["new", "approved", "paid"].includes(invoice.status)) {
          needsUpdate = true
          return { ...invoice, status: "new" }
        }
        return invoice
      })

      // Only save back if we actually made changes
      if (needsUpdate) {
        saveData("invoices", updatedInvoices)
        console.log("Converted legacy invoice statuses")
      }

      setInitialized(true)
    } catch (error) {
      console.error("Error during invoice status conversion:", error)
      setInitialized(true)
    }
  }, [])

  // Load invoices from localStorage for demo purposes
  useEffect(() => {
    if (!initialized) return

    const loadInvoices = () => {
      try {
        const allInvoices = loadData("invoices", [])

        if (allInvoices) {
          let allInvoicesTyped = allInvoices as SimpleInvoice[]

          console.log("Raw invoices from localStorage:", allInvoicesTyped.length)

          // OWNER SEES EVERYTHING by default, unless filters are applied
          if (isOwner) {
            console.log("User is owner, showing all invoices before filters")

            // Apply client filter if provided
            if (clientId) {
              console.log("Filtering by client ID:", clientId)
              allInvoicesTyped = allInvoicesTyped.filter((invoice: SimpleInvoice) => invoice.clientId === clientId)
            }

            // Apply specific filters if provided
            if (filterBy) {
              if (filterBy.status) {
                console.log("Filtering by status:", filterBy.status)
                allInvoicesTyped = allInvoicesTyped.filter(
                  (invoice: SimpleInvoice) => invoice.status === filterBy.status,
                )
              }
              if (filterBy.createdBy) {
                console.log("Filtering by creator:", filterBy.createdBy)
                allInvoicesTyped = allInvoicesTyped.filter(
                  (invoice: SimpleInvoice) => invoice.createdBy === filterBy.createdBy,
                )
              }
            }
          }
          // NON-OWNERS only see their own invoices - STRICT ENFORCEMENT
          else {
            console.log("User is not owner, showing only their own invoices")

            // Always filter to only show the user's own invoices
            allInvoicesTyped = allInvoicesTyped.filter((invoice: SimpleInvoice) => invoice.createdBy === user?.id)

            // Then apply additional filters if provided
            if (clientId) {
              allInvoicesTyped = allInvoicesTyped.filter((invoice: SimpleInvoice) => invoice.clientId === clientId)
            }

            if (filterBy?.status) {
              allInvoicesTyped = allInvoicesTyped.filter((invoice: SimpleInvoice) => invoice.status === filterBy.status)
            }
          }

          // Sort by date (newest first)
          allInvoicesTyped = allInvoicesTyped.sort(
            (a: SimpleInvoice, b: SimpleInvoice) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )

          console.log("Final filtered invoices:", allInvoicesTyped.length)
          setInvoices(allInvoicesTyped)
        } else {
          setInvoices([])
        }
      } catch (error) {
        console.error("Error loading invoices:", error)
        toast({
          title: "Error loading invoices",
          description: "There was a problem loading the invoices.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()

    // Add event listener to refresh invoices when localStorage changes
    const handleStorageChange = () => {
      console.log("Storage changed, reloading invoices")
      loadInvoices()
    }

    window.addEventListener("storage", handleStorageChange)

    // Also set up a polling mechanism to ensure we catch all changes
    const intervalId = setInterval(() => {
      loadInvoices()
    }, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(intervalId)
    }
  }, [clientId, toast, user, isOwner, filterBy, initialized])

  // Direct status change buttons
  const handleDirectStatusChange = (invoiceId: string, newStatus: string) => {
    console.log(`Attempting to change invoice ${invoiceId} status to ${newStatus}`)

    if (!isOwner) {
      console.log("User is not owner, cannot change status")
      toast({
        title: "Permission denied",
        description: "Only owners can change invoice status.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get all invoices first
      const storedInvoices = loadData("invoices", []) as SimpleInvoice[]

      if (!Array.isArray(storedInvoices)) {
        console.error("Expected storedInvoices to be an array, got:", typeof storedInvoices)
        return
      }

      console.log(`Found ${storedInvoices.length} invoices in storage`)

      // Find the invoice to update
      const invoiceToUpdate = storedInvoices.find((inv) => inv.id === invoiceId)
      if (!invoiceToUpdate) {
        console.error(`Invoice with ID ${invoiceId} not found`)
        return
      }

      console.log(`Found invoice to update: ${invoiceToUpdate.name}, current status: ${invoiceToUpdate.status}`)

      // Update the specific invoice
      const updatedAllInvoices = storedInvoices.map((invoice: SimpleInvoice) =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice,
      )

      // Save the updated invoices
      saveData("invoices", updatedAllInvoices)
      console.log(`Saved updated invoices to localStorage`)

      // Update the current state
      const updatedInvoices = invoices.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice,
      )
      setInvoices(updatedInvoices)
      console.log(`Updated local state with new invoice status`)

      toast({
        title: "Status updated",
        description: `Invoice status changed to ${newStatus}.`,
      })

      // Trigger storage event for other components
      window.dispatchEvent(new Event("storage"))
    } catch (error) {
      console.error("Error updating invoice status:", error)
      toast({
        title: "Error updating status",
        description: "There was a problem updating the invoice status.",
        variant: "destructive",
      })
    }
  }

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "new":
        return {
          variant: "outline" as const,
          label: "New",
          icon: <Clock className="h-3 w-3 mr-1" />,
        }
      case "approved":
        return {
          variant: "secondary" as const,
          label: "Approved",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
        }
      case "paid":
        return {
          variant: "default" as const,
          label: "Paid",
          icon: <CreditCard className="h-3 w-3 mr-1" />,
        }
      default:
        return {
          variant: "outline" as const,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          icon: <Clock className="h-3 w-3 mr-1" />,
        }
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Handle invoice download
  const handleDownloadInvoice = (invoice: SimpleInvoice) => {
    toast({
      title: "Generating PDF",
      description: `Invoice ${invoice.name} is being prepared for download.`,
    })

    // Convert SimpleInvoice to the format expected by generateInvoicePDF
    const pdfInvoice = {
      id: invoice.id,
      name: invoice.name,
      clientName: invoice.clientName,
      clientId: invoice.clientId,
      date: formatDate(new Date(invoice.date)),
      dueDate: formatDate(new Date(new Date(invoice.date).setDate(new Date(invoice.date).getDate() + 30))), // Assume 30 day terms
      status: invoice.status,
      items: invoice.items.map((item) => ({
        description: item.description,
        hours: item.quantity,
        rate: `$${item.rate.toFixed(2)}`,
        amount: `$${item.amount.toFixed(2)}`,
      })),
      subtotal: `$${invoice.total.toFixed(2)}`,
      tax: "$0.00",
      total: `$${invoice.total.toFixed(2)}`,
      createdByName: invoice.createdByName,
    }

    generateInvoicePDF(pdfInvoice).then((success) => {
      if (success) {
        toast({
          title: "PDF Downloaded",
          description: `Invoice ${invoice.name} has been downloaded successfully.`,
        })
      }
    })
  }

  // Handle invoice deletion
  const handleDeleteInvoice = (invoiceId: string) => {
    console.log(`Attempting to delete invoice ${invoiceId}`)

    // Find the invoice to delete
    const invoice = invoices.find((inv) => inv.id === invoiceId)

    if (!invoice) {
      console.error(`Invoice with ID ${invoiceId} not found`)
      toast({
        title: "Error",
        description: "Invoice not found.",
        variant: "destructive",
      })
      return
    }

    // Check permissions: Owner can delete any invoice, employees can only delete their own
    const canDelete = isOwner || invoice.createdBy === user?.id

    if (!canDelete) {
      console.log("Permission denied: User cannot delete this invoice")
      toast({
        title: "Permission denied",
        description: "You can only delete your own invoices.",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog with invoice details
    if (
      confirm(
        `Are you sure you want to delete invoice "${invoice.name}" for ${invoice.clientName}?\n\nThis action cannot be undone.`,
      )
    ) {
      try {
        console.log("User confirmed deletion, proceeding...")

        // Update local state
        const updatedInvoices = invoices.filter((inv) => inv.id !== invoiceId)
        setInvoices(updatedInvoices)

        // Update localStorage
        const storedInvoices = loadData("invoices", []) as SimpleInvoice[]

        if (!Array.isArray(storedInvoices)) {
          console.error("Expected storedInvoices to be an array, got:", typeof storedInvoices)
          return
        }

        const updatedStoredInvoices = storedInvoices.filter((inv: SimpleInvoice) => inv.id !== invoiceId)

        // Save updated invoices to localStorage
        saveData("invoices", updatedStoredInvoices)
        console.log(`Deleted invoice ${invoiceId} from localStorage`)

        toast({
          title: "Invoice deleted",
          description: `Invoice "${invoice.name}" has been deleted.`,
        })

        // Trigger storage event for other components
        window.dispatchEvent(new Event("storage"))
      } catch (error) {
        console.error("Error deleting invoice:", error)
        toast({
          title: "Error deleting invoice",
          description: "There was a problem deleting the invoice.",
          variant: "destructive",
        })
      }
    } else {
      console.log("User cancelled deletion")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading invoices...</div>
  }

  // Apply limit if provided
  const displayInvoices = limit ? invoices.slice(0, limit) : invoices

  if (displayInvoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No invoices found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {filterBy?.status
            ? `No ${filterBy.status} invoices found.`
            : filterBy?.createdBy
              ? "No invoices created by this user."
              : 'Create your first invoice by clicking the "New Invoice" button.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payrun ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayInvoices.map((invoice) => {
              const statusInfo = getStatusInfo(invoice.status)
              return (
                <TableRow
                  key={invoice.id}
                  className={invoice.createdBy !== user?.id && isOwner ? "bg-secondary/10" : ""}
                >
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.name}</TableCell>
                  <TableCell>${invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant} className="flex items-center w-fit">
                      {statusInfo.icon}
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(new Date(invoice.date))}</TableCell>
                  <TableCell>
                    {invoice.clientId !== "custom-client" ? (
                      <Link href={`/clients/${invoice.clientId}`} className="hover:underline">
                        {invoice.clientName}
                      </Link>
                    ) : (
                      invoice.clientName
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.createdBy !== user?.id && isOwner ? (
                      <Badge variant="outline" className="bg-secondary/20">
                        {invoice.createdByName}
                      </Badge>
                    ) : (
                      invoice.createdByName
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Direct status change buttons for owners */}
                      {isOwner && (
                        <>
                          <Button
                            variant={invoice.status === "new" ? "default" : "outline"}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDirectStatusChange(invoice.id, "new")}
                            title="Mark as New"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={invoice.status === "approved" ? "default" : "outline"}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDirectStatusChange(invoice.id, "approved")}
                            title="Mark as Approved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={invoice.status === "paid" ? "default" : "outline"}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDirectStatusChange(invoice.id, "paid")}
                            title="Mark as Paid"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>

                      {(isOwner || invoice.createdBy === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Invoice</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
