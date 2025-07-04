"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  amount: number
}

type SimpleInvoice = {
  id: string
  invoice_number: string
  description: string
  issue_date: string
  items: InvoiceItem[]
  amount: number
  status: string
  created_by: string
  created_by_name: string
  created_at: string
}

type FilterOptions = {
  status?: string
  createdBy?: string
}

export function SimpleInvoicesList({
  limit,
  filterBy,
}: {
  limit?: number
  filterBy?: FilterOptions
}) {
  const { toast: useToastToast } = useToast()
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleInvoice | null>(null)

  // Check if user is owner
  const isOwner = user?.role === "owner"

  useEffect(() => {
    setInitialized(true)
  }, [])

  // Load invoices from API
  useEffect(() => {
    if (!initialized) return

    const loadInvoices = async () => {
      try {
        const response = await apiClient.getInvoices()

        if (!response.success) {
          throw new Error(response.message || 'Failed to load invoices')
        }

        let allInvoices = response.data.invoices as SimpleInvoice[]

        // Non-owners only see their own invoices
        if (!isOwner) {
          allInvoices = allInvoices.filter(invoice => invoice.created_by === user?.id)
        }

        // Apply additional filters
        if (filterBy?.status) {
          allInvoices = allInvoices.filter(invoice => invoice.status === filterBy.status)
        }

        if (filterBy?.createdBy) {
          allInvoices = allInvoices.filter(invoice => invoice.created_by === filterBy.createdBy)
        }

        // Sort by date (newest first)
        allInvoices = allInvoices.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setInvoices(allInvoices)
      } catch (error) {
        console.error("Error loading invoices:", error)
        useToastToast({
          title: "Error loading invoices",
          description: "There was a problem loading the invoices.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()

    // Set up polling to refresh data
    const intervalId = setInterval(() => {
      loadInvoices()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(intervalId)
  }, [initialized, user?.id, isOwner, filterBy, useToastToast])

  const handleDeleteInvoice = async (invoiceId: string, invoice: SimpleInvoice) => {
    // Only owners and invoice creators can delete
    if (!isOwner && invoice.created_by !== user?.id) {
      useToastToast({
        title: "Permission denied",
        description: "You can only delete your own invoices.",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete invoice "${invoice.description}"?\n\nThis action cannot be undone.`)) {
      try {
        const response = await apiClient.deleteInvoice(parseInt(invoiceId))

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete invoice')
        }

        // Update local state
        setInvoices(invoices.filter(inv => inv.id !== invoiceId))

        useToastToast({
          title: "Invoice deleted",
          description: `Invoice "${invoice.description}" has been deleted.`,
        })
      } catch (error) {
        console.error("Error deleting invoice:", error)
        useToastToast({
          title: "Error deleting invoice",
          description: "There was a problem deleting the invoice.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteClick = (invoice: SimpleInvoice) => {
    setSelectedInvoice(invoice)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedInvoice) return

    try {
      const response = await apiClient.deleteInvoice(parseInt(selectedInvoice.id))

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete invoice')
      }

      // Only update UI if API call was successful
      toast.success("Invoice deleted successfully")
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== selectedInvoice.id))

      // Trigger a refresh of the invoices list
      const refreshResponse = await apiClient.getInvoices()
      if (refreshResponse.success) {
        let allInvoices = refreshResponse.data.invoices as SimpleInvoice[]

        // Apply filters
        if (!isOwner) {
          allInvoices = allInvoices.filter(invoice => invoice.created_by === user?.id)
        }
        if (filterBy?.status) {
          allInvoices = allInvoices.filter(invoice => invoice.status === filterBy.status)
        }
        if (filterBy?.createdBy) {
          allInvoices = allInvoices.filter(invoice => invoice.created_by === filterBy.createdBy)
        }

        // Sort by date (newest first)
        allInvoices = allInvoices.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setInvoices(allInvoices)
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Failed to delete invoice")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedInvoice(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading invoices...</div>
  }

  // Apply limit if provided
  const displayInvoices = limit ? invoices.slice(0, limit) : invoices

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                    {invoice.description}
                  </Link>
                </div>
              </TableCell>
              <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
              <TableCell>
                ${typeof invoice.amount === 'number'
                  ? invoice.amount.toFixed(2)
                  : parseFloat(invoice.amount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    invoice.status === "paid"
                      ? "success"
                      : invoice.status === "approved"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => generateInvoicePDF(invoice)}
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {(isOwner || invoice.created_by === user?.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(invoice)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {displayInvoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice #{selectedInvoice?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
