"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    Calculator,
    FileText,
    Target,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    MoreHorizontal
} from "lucide-react"
import {
    ResponsiveContainer,
    Area,
    AreaChart,
    XAxis,
    CartesianGrid,
    Tooltip
} from "recharts"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface FinancialSummary {
    totalRevenue: number
    totalExpenses: number
    totalProfitAdded: number
    netProfit: number
}

interface FinancialAnalytics {
    revenueAnalytics: any[]
    expenseAnalytics: any[]
    profitAnalytics: any[]
    currentBalance: { current_profit_balance: number }
    summary: FinancialSummary
    expenseCategories: any[]
    recentTransactions: any[]
}

interface Expense {
    id: number
    category: string
    amount: number
    description: string
    expense_date: string
    receipt_url?: string
    created_by_name: string
    created_at: string
}

type ChartData = {
    month: string
    value: number
    lastPeriodValue: number
}

type FinancialChart = {
    key: string
    title: string
    value: number
    suffix: string
    type: string
    change: string
    changeType: "positive" | "negative" | "neutral"
    chartData: ChartData[]
}

export function FinancialAnalytics() {
    const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState('12months')
    const [activeChart, setActiveChart] = useState<string>("revenue")
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false)

    // Expense form state
    const [expenseForm, setExpenseForm] = useState({
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        receipt_url: ''
    })

    // Adjustment form state
    const [adjustmentForm, setAdjustmentForm] = useState({
        adjustment_type: 'add',
        amount: '',
        reason: ''
    })

    // Fetch financial analytics
    const fetchAnalytics = async () => {
        try {
            setIsLoading(true)
            const response = await apiClient.get(`/dashboard/financial-analytics?period=${selectedPeriod}`)
            if (response.success) {
                setAnalytics(response.data)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
            toast.error('Failed to fetch financial analytics')
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch expenses
    const fetchExpenses = async () => {
        try {
            const response = await apiClient.get(`/dashboard/expenses?period=${selectedPeriod}`)
            if (response.success) {
                setExpenses(response.data.expenses)
            }
        } catch (error) {
            console.error('Error fetching expenses:', error)
            toast.error('Failed to fetch expenses')
        }
    }

    useEffect(() => {
        fetchAnalytics()
        fetchExpenses()
    }, [selectedPeriod])

    // Handle add expense
    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await apiClient.post('/dashboard/expenses', {
                ...expenseForm,
                amount: parseFloat(expenseForm.amount)
            })

            if (response.success) {
                toast.success('Expense added successfully')
                setIsAddExpenseOpen(false)
                setExpenseForm({
                    category: '',
                    amount: '',
                    description: '',
                    expense_date: new Date().toISOString().split('T')[0],
                    receipt_url: ''
                })
                fetchAnalytics()
                fetchExpenses()
            }
        } catch (error) {
            console.error('Error adding expense:', error)
            toast.error('Failed to add expense')
        }
    }

    // Handle add profit adjustment
    const handleAddAdjustment = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await apiClient.post('/dashboard/profit-adjustments', {
                ...adjustmentForm,
                amount: parseFloat(adjustmentForm.amount)
            })

            if (response.success) {
                toast.success('Profit adjustment added successfully')
                setIsAddAdjustmentOpen(false)
                setAdjustmentForm({
                    adjustment_type: 'add',
                    amount: '',
                    reason: ''
                })
                fetchAnalytics()
            }
        } catch (error) {
            console.error('Error adding adjustment:', error)
            toast.error('Failed to add profit adjustment')
        }
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    // Format value for display
    const formatValue = (value: number, type: string) => {
        if (type === "currency") {
            if (value >= 1000000) {
                return "$" + (value / 1000000).toFixed(1) + "M";
            } else if (value >= 1000) {
                return "$" + (value / 1000).toFixed(0) + "k";
            }
            return formatCurrency(value);
        }
        if (type === "percentage") return `${value.toFixed(1)}%`;
        return value.toLocaleString();
    }

    // Prepare chart data
    const prepareChartData = (): FinancialChart[] => {
        if (!analytics) return []

        // Combine and process data for charts
        const revenueMap = new Map()
        const expenseMap = new Map()
        const profitMap = new Map()

        analytics.revenueAnalytics.forEach(item => {
            revenueMap.set(item.period, item.revenue || 0)
        })

        analytics.expenseAnalytics.forEach(item => {
            if (!expenseMap.has(item.period)) {
                expenseMap.set(item.period, 0)
            }
            expenseMap.set(item.period, expenseMap.get(item.period) + (item.total_expenses || 0))
        })

        analytics.profitAnalytics.forEach(item => {
            profitMap.set(item.period, item.profit_added || 0)
        })

        const allPeriods = Array.from(new Set([
            ...revenueMap.keys(),
            ...expenseMap.keys(),
            ...profitMap.keys()
        ])).sort()

        const chartData = allPeriods.map(period => ({
            month: period,
            revenue: revenueMap.get(period) || 0,
            expenses: expenseMap.get(period) || 0,
            profit: (revenueMap.get(period) || 0) - (expenseMap.get(period) || 0),
            profitAdded: profitMap.get(period) || 0
        }))

        // Calculate changes (comparing current vs previous period)
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current === 0 ? "0%" : "100%"
            return `${(((current - previous) / previous) * 100).toFixed(1)}%`
        }

        const getChangeType = (current: number, previous: number): "positive" | "negative" | "neutral" => {
            if (previous === 0) return current === 0 ? "neutral" : "positive"
            const change = ((current - previous) / previous) * 100
            return change > 0 ? "positive" : change < 0 ? "negative" : "neutral"
        }

        const currentRevenue = analytics.summary.totalRevenue
        const currentExpenses = analytics.summary.totalExpenses
        const currentProfitAdded = analytics.summary.totalProfitAdded
        const currentNetProfit = analytics.summary.netProfit

        // For demonstration, we'll use the last two periods to calculate change
        const lastPeriodRevenue = chartData.length > 1 ? chartData[chartData.length - 2].revenue : 0
        const lastPeriodExpenses = chartData.length > 1 ? chartData[chartData.length - 2].expenses : 0
        const lastPeriodProfitAdded = chartData.length > 1 ? chartData[chartData.length - 2].profitAdded : 0
        const lastPeriodNetProfit = chartData.length > 1 ?
            chartData[chartData.length - 2].revenue - chartData[chartData.length - 2].expenses : 0

        return [
            {
                key: "revenue",
                title: "Total Revenue",
                value: currentRevenue,
                suffix: "revenue",
                type: "currency",
                change: calculateChange(currentRevenue, lastPeriodRevenue),
                changeType: getChangeType(currentRevenue, lastPeriodRevenue),
                chartData: chartData.map(item => ({
                    month: item.month,
                    value: item.revenue,
                    lastPeriodValue: lastPeriodRevenue
                }))
            },
            {
                key: "expenses",
                title: "Total Expenses",
                value: currentExpenses,
                suffix: "expenses",
                type: "currency",
                change: calculateChange(currentExpenses, lastPeriodExpenses),
                changeType: getChangeType(lastPeriodExpenses, currentExpenses), // Reverse for expenses
                chartData: chartData.map(item => ({
                    month: item.month,
                    value: item.expenses,
                    lastPeriodValue: lastPeriodExpenses
                }))
            },
            {
                key: "profit-added",
                title: "Profit Added",
                value: currentProfitAdded,
                suffix: "profit added",
                type: "currency",
                change: calculateChange(currentProfitAdded, lastPeriodProfitAdded),
                changeType: getChangeType(currentProfitAdded, lastPeriodProfitAdded),
                chartData: chartData.map(item => ({
                    month: item.month,
                    value: item.profitAdded,
                    lastPeriodValue: lastPeriodProfitAdded
                }))
            },
            {
                key: "net-profit",
                title: "Net Profit",
                value: currentNetProfit,
                suffix: "net profit",
                type: "currency",
                change: calculateChange(currentNetProfit, lastPeriodNetProfit),
                changeType: getChangeType(currentNetProfit, lastPeriodNetProfit),
                chartData: chartData.map(item => ({
                    month: item.month,
                    value: item.profit,
                    lastPeriodValue: lastPeriodNetProfit
                }))
            }
        ]
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading financial analytics...</p>
                </div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Failed to load financial analytics</p>
            </div>
        )
    }

    const chartsData = prepareChartData()
    const activeChartData = chartsData.find(chart => chart.key === activeChart) || chartsData[0]

    const getChartColor = (changeType: string) => {
        switch (changeType) {
            case "positive": return "hsl(var(--primary))"
            case "negative": return "hsl(var(--destructive))"
            default: return "hsl(var(--muted-foreground))"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with period selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Financial Analytics</h2>
                </div>
            </div>

            {/* Main Analytics Chart Card */}
            <Card className="border border-border">
                <CardHeader className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-y-2">
                            <CardTitle className="text-lg font-medium">Financial Overview</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Period Selector */}
                    <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-auto">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="3months">3 Months</TabsTrigger>
                            <TabsTrigger value="6months">6 Months</TabsTrigger>
                            <TabsTrigger value="12months">12 Months</TabsTrigger>
                            <TabsTrigger value="24months">24 Months</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Metric Selector Buttons */}
                    <div className="flex w-full items-center">
                        <div className="flex w-full max-w-none items-center gap-x-3 overflow-x-auto py-3">
                            {chartsData.map(({ key, change, changeType, type, value, title }) => (
                                <button
                                    key={key}
                                    className={cn(
                                        "flex min-w-[200px] flex-col gap-2 rounded-lg p-3 transition-colors border",
                                        {
                                            "bg-muted border-primary": activeChart === key,
                                            "hover:bg-muted/50": activeChart !== key,
                                        },
                                    )}
                                    onClick={() => setActiveChart(key)}
                                >
                                    <span
                                        className={cn("text-sm font-medium text-muted-foreground transition-colors", {
                                            "text-primary": activeChart === key,
                                        })}
                                    >
                                        {title}
                                    </span>
                                    <div className="flex items-center gap-x-3">
                                        <span className="text-2xl font-bold text-foreground">
                                            {formatValue(value, type)}
                                        </span>
                                        <Badge
                                            variant={
                                                changeType === "positive"
                                                    ? "default"
                                                    : changeType === "negative"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            {changeType === "positive" ? (
                                                <ArrowUpRight className="h-3 w-3" />
                                            ) : changeType === "negative" ? (
                                                <ArrowDownRight className="h-3 w-3" />
                                            ) : (
                                                <ArrowRight className="h-3 w-3" />
                                            )}
                                            <span>{change}</span>
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <ResponsiveContainer width="100%" height={300} className="[&_.recharts-surface]:outline-none">
                        <AreaChart
                            data={activeChartData.chartData}
                            margin={{
                                left: 20,
                                right: 20,
                                top: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="10%"
                                        stopColor={getChartColor(activeChartData.changeType)}
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={getChartColor(activeChartData.changeType)}
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                content={({ label, payload }) => (
                                    <div className="flex h-auto min-w-[120px] items-center gap-x-2 rounded-md bg-background p-3 text-sm shadow-md border">
                                        <div className="flex w-full flex-col gap-y-1">
                                            {payload?.map((p, index) => {
                                                const value = p.value as number;
                                                return (
                                                    <div key={`${index}-${p.name}`} className="flex w-full items-center gap-x-2">
                                                        <div className="flex w-full items-center gap-x-1 text-sm">
                                                            <span className="font-medium">{formatValue(value, activeChartData.type)}</span>
                                                            <span className="text-muted-foreground">{activeChartData.suffix}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <span className="text-xs text-muted-foreground">
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                cursor={{
                                    strokeWidth: 0,
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={getChartColor(activeChartData.changeType)}
                                strokeWidth={2}
                                fill="url(#colorGradient)"
                                fillOpacity={1}
                                activeDot={{
                                    stroke: getChartColor(activeChartData.changeType),
                                    strokeWidth: 2,
                                    fill: "hsl(var(--background))",
                                    r: 5,
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="lastPeriodValue"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={1}
                                fill="transparent"
                                strokeDasharray="5 5"
                                activeDot={{
                                    stroke: "hsl(var(--muted-foreground))",
                                    strokeWidth: 2,
                                    fill: "hsl(var(--background))",
                                    r: 4,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Management Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="profit">Profit Management</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Expense Categories Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Expense Categories Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.expenseCategories.map((category, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-primary" />
                                            <span className="font-medium">{category.category}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatCurrency(category.total_amount)}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {category.transaction_count} transactions
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {analytics.expenseCategories.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No expense categories found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Recent Financial Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analytics.recentTransactions.slice(0, 10).map((transaction, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${transaction.transaction_type === 'invoice_payment' ? 'bg-red-500' :
                                                    transaction.transaction_type === 'expense' ? 'bg-orange-500' :
                                                        transaction.transaction_type === 'profit_adjustment' ? 'bg-blue-500' :
                                                            'bg-gray-500'
                                                }`} />
                                            <div>
                                                <div className="font-medium">{transaction.description}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {transaction.created_by_name} • {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${transaction.transaction_type === 'invoice_payment' ? 'text-red-600' :
                                                transaction.transaction_type === 'expense' ? 'text-orange-600' :
                                                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.transaction_type === 'invoice_payment' || transaction.transaction_type === 'expense' ? '-' : ''}
                                            {formatCurrency(Math.abs(transaction.amount))}
                                        </div>
                                    </div>
                                ))}
                                {analytics.recentTransactions.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No recent transactions
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses" className="space-y-6">
                    {/* Add Expense Button */}
                    <div className="flex justify-end">
                        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Expense
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Expense</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddExpense} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="office">Office Supplies</SelectItem>
                                                <SelectItem value="software">Software</SelectItem>
                                                <SelectItem value="marketing">Marketing</SelectItem>
                                                <SelectItem value="travel">Travel</SelectItem>
                                                <SelectItem value="utilities">Utilities</SelectItem>
                                                <SelectItem value="equipment">Equipment</SelectItem>
                                                <SelectItem value="professional">Professional Services</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={expenseForm.description}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                            placeholder="Describe the expense..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expense_date">Date</Label>
                                        <Input
                                            id="expense_date"
                                            type="date"
                                            value={expenseForm.expense_date}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="receipt_url">Receipt URL (optional)</Label>
                                        <Input
                                            id="receipt_url"
                                            value={expenseForm.receipt_url}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, receipt_url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Add Expense
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Expenses List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {expenses.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{expense.category}</Badge>
                                            <div>
                                                <div className="font-medium">{expense.description}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {expense.created_by_name} • {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-red-600">
                                            {formatCurrency(expense.amount)}
                                        </div>
                                    </div>
                                ))}
                                {expenses.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No expenses recorded yet
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profit" className="space-y-6">
                    {/* Profit Balance Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Profit Balance Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Profit Added (Manual)</span>
                                    <span className="font-bold text-green-600">
                                        +{formatCurrency(analytics.summary.totalProfitAdded)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Invoice Payments</span>
                                    <span className="font-bold text-red-600">
                                        -{formatCurrency(analytics.summary.totalRevenue)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Business Expenses</span>
                                    <span className="font-bold text-red-600">
                                        -{formatCurrency(analytics.summary.totalExpenses)}
                                    </span>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Net Profit Balance</span>
                                        <span className={`text-xl font-bold ${analytics.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(analytics.summary.netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add Profit Adjustment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Profit Adjustments</span>
                                <Dialog open={isAddAdjustmentOpen} onOpenChange={setIsAddAdjustmentOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Adjustment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Profit Adjustment</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddAdjustment} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="adjustment_type">Type</Label>
                                                <Select value={adjustmentForm.adjustment_type} onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, adjustment_type: value })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="add">Add to Profit</SelectItem>
                                                        <SelectItem value="subtract">Subtract from Profit</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="adjustment_amount">Amount</Label>
                                                <Input
                                                    id="adjustment_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={adjustmentForm.amount}
                                                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="reason">Reason</Label>
                                                <Textarea
                                                    id="reason"
                                                    value={adjustmentForm.reason}
                                                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                                                    placeholder="Explain the reason for this adjustment..."
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="w-full">
                                                Add Adjustment
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Use profit adjustments to manually add or subtract from your profit balance.
                                This is useful for one-time payments, corrections, or other financial adjustments.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Financial Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analytics.recentTransactions.map((transaction, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${transaction.transaction_type === 'invoice_payment' ? 'bg-red-500' :
                                                        transaction.transaction_type === 'expense' ? 'bg-orange-500' :
                                                            transaction.transaction_type === 'profit_adjustment' ? 'bg-blue-500' :
                                                                'bg-gray-500'
                                                    }`} />
                                                <Badge variant="outline" className="text-xs">
                                                    {transaction.transaction_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div>
                                                <div className="font-medium">{transaction.description}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    by {transaction.created_by_name} on {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${transaction.transaction_type === 'invoice_payment' ? 'text-red-600' :
                                                    transaction.transaction_type === 'expense' ? 'text-orange-600' :
                                                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {transaction.transaction_type === 'invoice_payment' || transaction.transaction_type === 'expense' ? '-' : ''}
                                                {formatCurrency(Math.abs(transaction.amount))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {analytics.recentTransactions.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No transactions found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
} 