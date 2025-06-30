"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowDownCircle,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Receipt,
  Clock,
  PauseCircle,
  PlayCircle,
  Settings,
} from "lucide-react"
import { getFinancialSummary, setupInvoiceSyncListener, type FinancialSummary } from "@/lib/invoice-sync-service"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Define refresh interval options
const REFRESH_INTERVALS = [
  { value: "0", label: "Off" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
  { value: "1800", label: "30 minutes" },
]

export function IncomeReport() {
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [activeDetailTab, setActiveDetailTab] = useState("monthly")
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("300") // Default to 5 minutes
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [showRefreshSettings, setShowRefreshSettings] = useState(false)

  // Refs for intervals
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Get current year
  const currentYear = new Date().getFullYear().toString()

  // Initialize financial data and set up listeners
  useEffect(() => {
    // Initial load
    refreshData(false)

    // Set up listener for changes
    const cleanup = setupInvoiceSyncListener((newSummary) => {
      setFinancialSummary(newSummary)
      setLastUpdated(newSummary.lastUpdated)
      updateNextRefreshTime()
    })

    return () => {
      cleanup()
      clearAutoRefreshTimers()
    }
  }, [])

  // Set up auto-refresh based on interval
  useEffect(() => {
    setupAutoRefresh()
    return () => clearAutoRefreshTimers()
  }, [refreshInterval, autoRefreshEnabled])

  // Clear all timers
  const clearAutoRefreshTimers = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  // Set up auto-refresh timer
  const setupAutoRefresh = () => {
    clearAutoRefreshTimers()

    // If auto-refresh is disabled or interval is set to 0, don't set up timers
    if (!autoRefreshEnabled || refreshInterval === "0") {
      setNextRefreshTime(null)
      setTimeRemaining("")
      return
    }

    const intervalMs = Number.parseInt(refreshInterval) * 1000

    // Set up the refresh timer
    refreshTimerRef.current = setInterval(() => {
      refreshData(false)
    }, intervalMs)

    // Set up countdown timer to update every second
    updateNextRefreshTime()
    countdownTimerRef.current = setInterval(updateCountdown, 1000)
  }

  // Update the next refresh time
  const updateNextRefreshTime = () => {
    if (autoRefreshEnabled && refreshInterval !== "0") {
      const intervalMs = Number.parseInt(refreshInterval) * 1000
      const nextTime = new Date(Date.now() + intervalMs)
      setNextRefreshTime(nextTime)
      updateCountdown()
    } else {
      setNextRefreshTime(null)
      setTimeRemaining("")
    }
  }

  // Update the countdown display
  const updateCountdown = () => {
    if (!nextRefreshTime) {
      setTimeRemaining("")
      return
    }

    const now = new Date()
    const diffMs = nextRefreshTime.getTime() - now.getTime()

    if (diffMs <= 0) {
      setTimeRemaining("Refreshing...")
      return
    }

    // Format the remaining time
    const diffSec = Math.floor(diffMs / 1000)
    const minutes = Math.floor(diffSec / 60)
    const seconds = diffSec % 60

    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
  }

  // Handle refresh interval change
  const handleRefreshIntervalChange = (value: string) => {
    setRefreshInterval(value)
  }

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = (checked: boolean) => {
    setAutoRefreshEnabled(checked)
  }

  // Refresh data function
  const refreshData = (showAnimation = true) => {
    if (showAnimation) {
      setIsRefreshing(true)
    }

    // Small delay to show the refresh animation if needed
    setTimeout(
      () => {
        const summary = getFinancialSummary(true)
        setFinancialSummary(summary)
        setLastUpdated(summary.lastUpdated)
        setIsRefreshing(false)
        updateNextRefreshTime()
      },
      showAnimation ? 500 : 0,
    )
  }

  // Handle manual refresh
  const handleManualRefresh = () => {
    refreshData(true)
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(date))
  }

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  // If data is not loaded yet
  if (!financialSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary/70" />
        <span className="ml-2 text-lg">Loading financial data...</span>
      </div>
    )
  }

  // Get current year data
  const currentYearData = financialSummary.yearly.find((y) => y.year === currentYear) || {
    year: currentYear,
    months: [],
    totalExpenses: 0,
    totalCount: 0,
  }

  // Prepare monthly chart data with expenses
  const monthlyChartData = currentYearData.months
    .map((month) => {
      return {
        name: formatMonth(month.month),
        expenses: month.expenses,
      }
    })
    .reverse() // Reverse to show oldest to newest

  // Prepare yearly chart data
  const yearlyChartData = financialSummary.yearly
    .map((year) => {
      return {
        name: year.year,
        expenses: year.totalExpenses,
      }
    })
    .reverse() // Reverse to show oldest to newest

  // Prepare client chart data
  const clientChartData = financialSummary.byClient
    .filter((client) => client.totalExpenses > 0) // Only include clients with expenses
    .map((client) => ({
      name: client.clientName,
      expenses: client.totalExpenses,
    }))
    .sort((a, b) => b.expenses - a.expenses) // Sort by highest expenses
    .slice(0, 5) // Top 5 clients

  // Calculate total expenses (using paid invoices)
  const totalExpenses = financialSummary.totalExpenses

  // Calculate average monthly expenses
  const monthCount = financialSummary.monthly.length || 1
  const avgMonthlyExpenses = totalExpenses / monthCount

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Expense Analysis</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">Last updated: {formatDate(lastUpdated)}</span>
          )}

          {timeRemaining && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Next refresh: {timeRemaining}</span>
            </div>
          )}

          <Popover open={showRefreshSettings} onOpenChange={setShowRefreshSettings}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Refresh Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Auto-Refresh Settings</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-refresh" checked={autoRefreshEnabled} onCheckedChange={handleAutoRefreshToggle} />
                    <Label htmlFor="auto-refresh">Auto-refresh</Label>
                  </div>
                  {autoRefreshEnabled ? (
                    <Badge variant="outline" className="bg-primary/10">
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/50">
                      <PauseCircle className="h-3 w-3 mr-1" />
                      Paused
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Refresh interval</Label>
                  <Select
                    value={refreshInterval}
                    onValueChange={handleRefreshIntervalChange}
                    disabled={!autoRefreshEnabled}
                  >
                    <SelectTrigger id="refresh-interval" className="w-full">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFRESH_INTERVALS.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setShowRefreshSettings(false)}>
                    Close
                  </Button>
                  <Button size="sm" onClick={handleManualRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh Now
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">From {financialSummary.invoiceCount} paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgMonthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground">Across {monthCount} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Year Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentYearData.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">From {currentYearData.totalCount} paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.invoiceCount}</div>
            <p className="text-xs text-muted-foreground">Total paid invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses ({currentYear})</CardTitle>
          <CardDescription>Expense trends for the current year (paid invoices only)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer
            config={{
              expenses: {
                label: "Expenses",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="expenses" fill="var(--color-expenses)" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10">
              {currentYearData.months.length} months
            </Badge>
            <Badge variant="outline" className="bg-primary/10">
              {currentYearData.totalCount} invoices
            </Badge>
          </div>
          <Button onClick={() => setShowDetailModal(true)}>View Details</Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Sources</CardTitle>
            <CardDescription>Expenses by client (top 5)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                expenses: {
                  label: "Expenses",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientChartData} layout="vertical" margin={{ top: 5, right: 10, left: 70, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Annual Expense Trends</CardTitle>
            <CardDescription>Expense trends across years (paid invoices only)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                expenses: {
                  label: "Expenses",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Modal */}
      <DetailedFinancialModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        financialSummary={financialSummary}
        activeTab={activeDetailTab}
        setActiveTab={setActiveDetailTab}
        formatMonth={formatMonth}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}

// Detailed Financial Modal Component
function DetailedFinancialModal({
  isOpen,
  onClose,
  financialSummary,
  activeTab,
  setActiveTab,
  formatMonth,
  formatCurrency,
}: {
  isOpen: boolean
  onClose: () => void
  financialSummary: FinancialSummary
  activeTab: string
  setActiveTab: (tab: string) => void
  formatMonth: (month: string) => string
  formatCurrency: (value: number) => string
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detailed Expense Report</DialogTitle>
          <DialogDescription>Comprehensive breakdown of expenses from paid invoices</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Summary</TabsTrigger>
            <TabsTrigger value="clients">Client Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                <div className="col-span-4">Month</div>
                <div className="col-span-3 text-right">Expenses</div>
                <div className="col-span-2 text-right">Invoices</div>
                <div className="col-span-3 text-right">Avg per Invoice</div>
              </div>
              <div className="divide-y">
                {financialSummary.monthly.map((month) => {
                  const avgPerInvoice = month.count > 0 ? month.expenses / month.count : 0

                  return (
                    <div key={month.month} className="grid grid-cols-12 gap-2 p-3 text-sm">
                      <div className="col-span-4">{formatMonth(month.month)}</div>
                      <div className="col-span-3 text-right">{formatCurrency(month.expenses)}</div>
                      <div className="col-span-2 text-right">{month.count}</div>
                      <div className="col-span-3 text-right">{formatCurrency(avgPerInvoice)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                <div className="col-span-3">Year</div>
                <div className="col-span-3 text-right">Total Expenses</div>
                <div className="col-span-3 text-right">Invoices</div>
                <div className="col-span-3 text-right">Avg per Invoice</div>
              </div>
              <div className="divide-y">
                {financialSummary.yearly.map((year) => {
                  const avgPerInvoice = year.totalCount > 0 ? year.totalExpenses / year.totalCount : 0

                  return (
                    <div key={year.year} className="grid grid-cols-12 gap-2 p-3 text-sm">
                      <div className="col-span-3">{year.year}</div>
                      <div className="col-span-3 text-right">{formatCurrency(year.totalExpenses)}</div>
                      <div className="col-span-3 text-right">{year.totalCount}</div>
                      <div className="col-span-3 text-right">{formatCurrency(avgPerInvoice)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="mt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                <div className="col-span-4">Client</div>
                <div className="col-span-3 text-right">Total Expenses</div>
                <div className="col-span-2 text-right">Invoices</div>
                <div className="col-span-3 text-right">Avg per Invoice</div>
              </div>
              <div className="divide-y">
                {financialSummary.byClient
                  .sort((a, b) => b.totalExpenses - a.totalExpenses)
                  .map((client) => {
                    const avgPerInvoice = client.invoiceCount > 0 ? client.totalExpenses / client.invoiceCount : 0

                    return (
                      <div key={client.clientId} className="grid grid-cols-12 gap-2 p-3 text-sm">
                        <div className="col-span-4">{client.clientName}</div>
                        <div className="col-span-3 text-right">{formatCurrency(client.totalExpenses)}</div>
                        <div className="col-span-2 text-right">{client.invoiceCount}</div>
                        <div className="col-span-3 text-right">{formatCurrency(avgPerInvoice)}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
