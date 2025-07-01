"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Trash2, CheckCircle, Clock, CreditCard } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { generateInvoicePDF } from "@/lib/pdf-generator"

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
  client_id: string
  client_name: string
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

        // Apply filters
        if (clientId) {
          allInvoices = allInvoices.filter(invoice => invoice.client_id === clientId)
        }

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

    // Set up polling to refresh data
    const intervalId = setInterval(() => {
      loadInvoices()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(intervalId)
  }, [initialized, user?.id, isOwner, clientId, filterBy, toast])

  const handleDeleteInvoice = async (invoiceId: string, invoice: SimpleInvoice) => {
    // Only owners and invoice creators can delete
    if (!isOwner && invoice.created_by !== user?.id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own invoices.",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete invoice "${invoice.description}" for ${invoice.client_name}?\n\nThis action cannot be undone.`)) {
      try {
        const response = await apiClient.deleteInvoice(parseInt(invoiceId))

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete invoice')
        }

        // Update local state
        setInvoices(invoices.filter(inv => inv.id !== invoiceId))

        toast({
          title: "Invoice deleted",
          description: `Invoice "${invoice.description}" has been deleted.`,
        })
      } catch (error) {
        console.error("Error deleting invoice:", error)
        toast({
          title: "Error deleting invoice",
          description: "There was a problem deleting the invoice.",
          variant: "destructive",
        })
      }
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
            <TableHead>Client</TableHead>
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
              <TableCell>{invoice.client_name}</TableCell>
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
                      : invoice.status === "pending"
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
                      onClick={() => handleDeleteInvoice(invoice.id, invoice)}
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
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
