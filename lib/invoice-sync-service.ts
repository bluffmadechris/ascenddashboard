"use client"

import { loadData } from "./data-persistence"

// Define types for invoice data
export type InvoiceItem = {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export type SimpleInvoice = {
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

// Define types for financial data
export type MonthlyFinancialData = {
  month: string // Format: YYYY-MM
  expenses: number // Treating paid invoices as expenses
  count: number // Count of paid invoices
}

export type YearlyFinancialData = {
  year: string
  months: MonthlyFinancialData[]
  totalExpenses: number // Total expenses for the year
  totalCount: number // Count of paid invoices
}

export type ClientFinancialData = {
  clientId: string
  clientName: string
  monthly: MonthlyFinancialData[]
  yearly: YearlyFinancialData[]
  totalExpenses: number // Total expenses for the client
  invoiceCount: number // Count of paid invoices
}

export type FinancialSummary = {
  monthly: MonthlyFinancialData[]
  yearly: YearlyFinancialData[]
  byClient: ClientFinancialData[]
  totalExpenses: number // Total expenses overall
  invoiceCount: number // Count of paid invoices
  lastUpdated: Date
}

// Helper function to get month string in YYYY-MM format
const getMonthString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

// Helper function to get year string
const getYearString = (date: Date): string => {
  return `${date.getFullYear()}`
}

// Function to synchronize invoice data and generate financial summary
export function synchronizeInvoiceData(): FinancialSummary {
  // Load all invoices
  const invoices = loadData<SimpleInvoice[]>("invoices", [])

  // Initialize data structures
  const monthlyData: Record<string, MonthlyFinancialData> = {}
  const yearlyData: Record<string, YearlyFinancialData> = {}
  const clientData: Record<string, ClientFinancialData> = {}

  // Initialize summary
  const summary: FinancialSummary = {
    monthly: [],
    yearly: [],
    byClient: [],
    totalExpenses: 0,
    invoiceCount: 0,
    lastUpdated: new Date(),
  }

  // Process each invoice - only count PAID invoices as expenses
  invoices.forEach((invoice) => {
    // Skip if not paid
    if (invoice.status !== "PAID" && invoice.status !== "paid") {
      return
    }

    const invoiceDate = new Date(invoice.date)
    const monthKey = getMonthString(invoiceDate)
    const yearKey = getYearString(invoiceDate)
    const amount = invoice.total || 0

    // Update monthly data
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        expenses: 0,
        count: 0,
      }
    }

    monthlyData[monthKey].count += 1
    monthlyData[monthKey].expenses += amount

    // Update yearly data
    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = {
        year: yearKey,
        months: [],
        totalExpenses: 0,
        totalCount: 0,
      }
    }

    yearlyData[yearKey].totalCount += 1
    yearlyData[yearKey].totalExpenses += amount

    // Update client data
    if (!clientData[invoice.clientId]) {
      clientData[invoice.clientId] = {
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        monthly: [],
        yearly: [],
        totalExpenses: 0,
        invoiceCount: 0,
      }
    }

    clientData[invoice.clientId].invoiceCount += 1
    clientData[invoice.clientId].totalExpenses += amount

    // Update summary totals
    summary.invoiceCount += 1
    summary.totalExpenses += amount
  })

  // Convert record objects to arrays and sort
  summary.monthly = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month))

  // Process yearly data and include monthly data
  Object.values(yearlyData).forEach((yearData) => {
    // Add monthly data to each year
    yearData.months = summary.monthly.filter((m) => m.month.startsWith(yearData.year))
    yearlyData[yearData.year] = yearData
  })

  summary.yearly = Object.values(yearlyData).sort((a, b) => b.year.localeCompare(a.year))

  // Process client data
  Object.values(clientData).forEach((client) => {
    // Filter monthly and yearly data for this client
    const clientInvoices = invoices.filter(
      (inv) => inv.clientId === client.clientId && (inv.status === "PAID" || inv.status === "paid"),
    )

    // Process monthly data for this client
    const clientMonthlyData: Record<string, MonthlyFinancialData> = {}

    clientInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date)
      const monthKey = getMonthString(invoiceDate)
      const amount = invoice.total || 0

      if (!clientMonthlyData[monthKey]) {
        clientMonthlyData[monthKey] = {
          month: monthKey,
          expenses: 0,
          count: 0,
        }
      }

      clientMonthlyData[monthKey].count += 1
      clientMonthlyData[monthKey].expenses += amount
    })

    client.monthly = Object.values(clientMonthlyData).sort((a, b) => b.month.localeCompare(a.month))

    // Process yearly data for this client
    const clientYearlyData: Record<string, YearlyFinancialData> = {}

    clientInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date)
      const yearKey = getYearString(invoiceDate)
      const amount = invoice.total || 0

      if (!clientYearlyData[yearKey]) {
        clientYearlyData[yearKey] = {
          year: yearKey,
          months: [],
          totalExpenses: 0,
          totalCount: 0,
        }
      }

      clientYearlyData[yearKey].totalCount += 1
      clientYearlyData[yearKey].totalExpenses += amount
    })

    // Add monthly data to each year
    Object.values(clientYearlyData).forEach((yearData) => {
      yearData.months = client.monthly.filter((m) => m.month.startsWith(yearData.year))
      clientYearlyData[yearData.year] = yearData
    })

    client.yearly = Object.values(clientYearlyData).sort((a, b) => b.year.localeCompare(a.year))
  })

  summary.byClient = Object.values(clientData)

  return summary
}

// Function to get cached financial summary or generate a new one
let cachedSummary: FinancialSummary | null = null
let lastSyncTime = 0

export function getFinancialSummary(forceRefresh = false): FinancialSummary {
  const now = Date.now()

  // If cache is expired (5 minutes) or force refresh is requested
  if (forceRefresh || !cachedSummary || now - lastSyncTime > 5 * 60 * 1000) {
    cachedSummary = synchronizeInvoiceData()
    lastSyncTime = now
  }

  return cachedSummary
}

// Function to listen for invoice changes and update the summary
export function setupInvoiceSyncListener(callback: (summary: FinancialSummary) => void): () => void {
  const handleStorageChange = () => {
    const summary = getFinancialSummary(true)
    callback(summary)
  }

  window.addEventListener("storage", handleStorageChange)

  // Set up polling as a backup
  const intervalId = setInterval(() => {
    const summary = getFinancialSummary(true)
    callback(summary)
  }, 30000) // Check every 30 seconds

  // Return cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange)
    clearInterval(intervalId)
  }
}
