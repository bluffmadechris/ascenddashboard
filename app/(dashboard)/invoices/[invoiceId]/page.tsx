"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample invoice data - in a real app, this would come from an API
const invoiceData = {
  "INV-2023-001": {
    id: "INV-2023-001",
    clientName: "Client DEF",
    clientId: "CLIENT-DEF",
    amount: "$1,850.00",
    date: "April 15, 2023",
    dueDate: "May 15, 2023",
    status: "overdue",
    items: [
      { description: "Website Design", hours: 15, rate: "$75.00", amount: "$1,125.00" },
      { description: "Content Creation", hours: 8, rate: "$65.00", amount: "$520.00" },
      { description: "SEO Optimization", hours: 3, rate: "$68.33", amount: "$205.00" },
    ],
    subtotal: "$1,850.00",
    tax: "$0.00",
    total: "$1,850.00",
  },
  "INV-2023-002": {
    id: "INV-2023-002",
    clientName: "Client ABC",
    clientId: "CLIENT-ABC",
    amount: "$3,200.00",
    date: "April 28, 2023",
    dueDate: "May 28, 2023",
    status: "paid",
    items: [
      { description: "Brand Strategy", hours: 20, rate: "$85.00", amount: "$1,700.00" },
      { description: "Logo Design", hours: 12, rate: "$75.00", amount: "$900.00" },
      { description: "Brand Guidelines", hours: 10, rate: "$60.00", amount: "$600.00" },
    ],
    subtotal: "$3,200.00",
    tax: "$0.00",
    total: "$3,200.00",
    paidDate: "May 20, 2023",
  },
  "INV-2023-003": {
    id: "INV-2023-003",
    clientName: "Client GHI",
    clientId: "CLIENT-GHI",
    amount: "$4,750.00",
    date: "May 10, 2023",
    dueDate: "June 10, 2023",
    status: "rejected",
    items: [
      { description: "Social Media Campaign", hours: 25, rate: "$80.00", amount: "$2,000.00" },
      { description: "Content Creation", hours: 15, rate: "$70.00", amount: "$1,050.00" },
      { description: "Performance Analysis", hours: 20, rate: "$85.00", amount: "$1,700.00" },
    ],
    subtotal: "$4,750.00",
    tax: "$0.00",
    total: "$4,750.00",
    rejectionReason: "Budget exceeded approved amount. Please revise and resubmit.",
  },
  "INV-2023-004": {
    id: "INV-2023-004",
    clientName: "Client XYZ",
    clientId: "CLIENT-XYZ",
    amount: "$2,450.00",
    date: "May 15, 2023",
    dueDate: "June 15, 2023",
    status: "approved",
    items: [
      { description: "Video Production", hours: 18, rate: "$85.00", amount: "$1,530.00" },
      { description: "Video Editing", hours: 12, rate: "$70.00", amount: "$840.00" },
      { description: "Voiceover", hours: 1, rate: "$80.00", amount: "$80.00" },
    ],
    subtotal: "$2,450.00",
    tax: "$0.00",
    total: "$2,450.00",
    approvedBy: "John Manager",
    approvedDate: "May 18, 2023",
  },
}

export default function InvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isOwner = user?.role === "owner"

  const invoiceId = params?.invoiceId as string

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.getInvoice(invoiceId)
        if (response.success && response.data?.invoice) {
          setInvoice(response.data.invoice)
        } else {
          setError("Invoice not found")
          toast({
            title: "Invoice Not Found",
            description: `The invoice ${invoiceId} could not be found.`,
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Error fetching invoice:", err)
        setError("Failed to load invoice")
        toast({
          title: "Error",
          description: "There was an error loading the invoice. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Paid</Badge>
      case "overdue":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Overdue</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Draft</Badge>
    }
  }

  // Function to render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "paid":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "overdue":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  // Function to update invoice status
  const updateInvoiceStatus = async (newStatus: string) => {
    if (!isOwner) {
      toast({
        title: "Permission Denied",
        description: "Only owners can change invoice status.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await apiClient.updateInvoiceStatus(invoiceId, newStatus)
      console.log('Invoice status update response:', response)

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || "Failed to update invoice status. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Update the local invoice state with the new status
      // If the API returns updated invoice data, use it; otherwise just update the status locally
      if (response.data && typeof response.data === 'object') {
        setInvoice(response.data)
      } else {
        // Fallback: update just the status locally
        setInvoice(prev => ({ ...prev, status: newStatus }))
      }

      toast({
        title: "Status Updated",
        description: `Invoice status has been updated to ${newStatus}.`,
      })
    } catch (err: any) {
      console.error("Error updating invoice status:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update invoice status. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!invoice) return
              toast({
                title: "Generating PDF",
                description: "Your invoice PDF is being prepared...",
              })
              generateInvoicePDF(invoice).then((success) => {
                if (success) {
                  toast({
                    title: "PDF Downloaded",
                    description: `Invoice ${invoice.id} has been downloaded successfully.`,
                  })
                }
              })
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-1/4" />
          </CardFooter>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Error Loading Invoice</CardTitle>
            <CardDescription>
              We couldn't load the invoice you requested. It may not exist or you may not have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/invoices")}>Return to Invoices</Button>
          </CardFooter>
        </Card>
      ) : invoice ? (
        <>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Invoice {invoice.invoice_number}</CardTitle>
                  <CardDescription>Issued on {new Date(invoice.issue_date).toLocaleDateString()}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  {isOwner && (
                    <Select
                      value={invoice.status}
                      onValueChange={updateInvoiceStatus}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center gap-2">
                    {renderStatusIcon(invoice.status)}
                    {renderStatusBadge(invoice.status)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">From</h3>
                  <p className="font-medium">Ascend Media</p>
                  <p>123 Business Street</p>
                  <p>Suite 100</p>
                  <p>New York, NY 10001</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">To</h3>
                  <p className="font-medium">{invoice.client?.name || 'No Client'}</p>
                  {invoice.client && <p>Client ID: {invoice.client.id}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Invoice Details</h3>
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {invoice.items?.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm text-right font-bold">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold">
                          {formatCurrency(invoice.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status-specific information */}
              {invoice.status === "approved" && invoice.approved_by && invoice.approved_date && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-md p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-400">Invoice Approved</h4>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        This invoice was approved by {invoice.approved_by} on {new Date(invoice.approved_date).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {invoice.status === "rejected" && invoice.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md p-4">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-400">Invoice Rejected</h4>
                      <p className="text-sm text-red-700 dark:text-red-500">
                        {invoice.rejection_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {invoice.status === "overdue" && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-400">Invoice Overdue</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        This invoice was due on {new Date(invoice.due_date).toLocaleDateString()} and is now overdue.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => router.push("/invoices")}>
                Back to Invoices
              </Button>

              {invoice.status === "approved" && (
                <Button
                  onClick={() => {
                    toast({
                      title: "Generating PDF",
                      description: "Your invoice PDF is being prepared...",
                    })
                    generateInvoicePDF(invoice).then((success) => {
                      if (success) {
                        toast({
                          title: "PDF Downloaded",
                          description: `Invoice ${invoice.id} has been downloaded successfully.`,
                        })
                      }
                    })
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}

              {invoice.status === "rejected" && <Button>Edit and Resubmit</Button>}

              {invoice.status === "overdue" && <Button>Send Reminder</Button>}
            </CardFooter>
          </Card>
        </>
      ) : null}
    </div>
  )
}
