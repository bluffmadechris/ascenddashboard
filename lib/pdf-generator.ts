import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

// Define invoice item type
type InvoiceItem = {
  description: string
  quantity: number
  rate: string
  amount: string
}

// Define invoice type
type Invoice = {
  id: string
  name?: string
  fromName: string
  date: string | Date
  dueDate: string | Date
  status: string
  items: InvoiceItem[]
  subtotal: string
  tax: string
  total: string
  createdByName?: string
  paidDate?: string
  approvedBy?: string
  approvedDate?: string
  rejectionReason?: string
}

/**
 * Format a date string or Date object to a readable format
 */
const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'MMM dd, yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return typeof date === 'string' ? date : date.toLocaleDateString()
  }
}

/**
 * Generate and download a PDF for an invoice
 */
export const generateInvoicePDF = async (rawInvoice: any): Promise<boolean> => {
  // Normalize different invoice shapes into a common format
  const invoice: Invoice = {
    id: rawInvoice.id ?? rawInvoice.invoice_number ?? 'N/A',
    name: rawInvoice.name ?? rawInvoice.description ?? 'Invoice',
    fromName: rawInvoice.createdByName ?? rawInvoice.created_by_name ?? 'Unknown',
    date: rawInvoice.date ?? rawInvoice.issue_date ?? new Date(),
    dueDate: rawInvoice.dueDate ?? rawInvoice.due_date ?? rawInvoice.issue_date ?? new Date(),
    status: rawInvoice.status ?? 'draft',
    items: (rawInvoice.items ?? []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity ?? 1,
      rate: typeof item.rate === 'number' ? item.rate.toFixed(2) : String(item.rate ?? 0),
      amount: typeof item.amount === 'number' ? item.amount.toFixed(2) : String(item.amount),
    })),
    subtotal: rawInvoice.subtotal ?? (typeof rawInvoice.amount === 'number' ? rawInvoice.amount.toFixed(2) : String(rawInvoice.amount)),
    tax: rawInvoice.tax ?? '0.00',
    total: rawInvoice.total ?? (typeof rawInvoice.amount === 'number' ? rawInvoice.amount.toFixed(2) : String(rawInvoice.amount)),
    createdByName: rawInvoice.created_by_name ?? undefined,
    paidDate: rawInvoice.paidDate ?? rawInvoice.paid_date ?? undefined,
    approvedBy: rawInvoice.approvedBy ?? rawInvoice.approved_by ?? undefined,
    approvedDate: rawInvoice.approvedDate ?? rawInvoice.approved_date ?? undefined,
    rejectionReason: rawInvoice.rejectionReason ?? rawInvoice.rejection_reason ?? undefined,
  } as Invoice;

  try {
    // Create a new PDF document
    const doc = new jsPDF()

    // Initialize autoTable plugin
    autoTable(doc, {})

    // Add sender name
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(invoice.fromName, 20, 20)

    // Add INVOICE text
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("INVOICE", 140, 20)
    
    // Add invoice number
    doc.setFontSize(12)
    doc.text(`#${invoice.id}`, 140, 30)

    // Add dates with proper formatting
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Date:", 140, 45)
    doc.text(formatDate(invoice.date), 170, 45)

    // Add Balance Due
    doc.setFontSize(12)
    doc.text("Balance Due:", 140, 65)
    doc.setFont("helvetica", "bold")
    doc.text(`$${invoice.total}`, 170, 65)

    // Add billing information
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Bill To:", 20, 45)
    doc.text("Ascend Media Co, LLC", 20, 52)
    doc.text("Contact Information:", 20, 65)
    doc.text("outreachascendmedia@gmail.com", 20, 72)

    // Add invoice items table
    const tableColumn = ["Item", "Quantity", "Rate", "Amount"]
    const tableRows = invoice.items.map(item => [
      item.description,
      item.quantity,
      `$${item.rate}`,
      `$${item.amount}`
    ])

    // Generate the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    // Get the final y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Add totals
    doc.setFontSize(10)
    doc.text("Subtotal:", 120, finalY)
    doc.text(`$${invoice.subtotal}`, 170, finalY, { align: "right" })

    doc.text("Tax (0%):", 120, finalY + 7)
    doc.text(`$${invoice.tax}`, 170, finalY + 7, { align: "right" })

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Total:", 120, finalY + 15)
    doc.text(`$${invoice.total}`, 170, finalY + 15, { align: "right" })

    // Add terms
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Terms:", 20, finalY + 30)
    doc.text("Direct Deposit", 20, finalY + 37)

    // Save the PDF
    doc.save(`Invoice-${invoice.id}.pdf`)
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    toast({
      title: "PDF Generation Failed",
      description: "There was an error generating the PDF. Please try again.",
      variant: "destructive",
    })
    return false
  }
}
