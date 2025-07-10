"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Target,
    ArrowRight,
    Users,
    Calendar,
    BarChart3,
    PieChart,
    ExternalLink
} from "lucide-react"
import { loadData } from "@/lib/data-persistence"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from "recharts"

// Types
interface ClientAnalyticsData {
    id: string
    name: string
    totalRevenue: number
    totalInvoices: number
    pendingInvoices: number
    totalProfit: number
    invoiceCount: number
    revenueChange: number
    status: 'active' | 'inactive'
    lastActivity: Date
}

interface SimpleInvoice {
    id: string
    clientId: string
    clientName: string
    total: number
    status: string
    date: Date
}

interface ClientMonthlyRevenue {
    clientId: string
    revenues: { month: string; amount: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ClientAnalytics() {
    const { user } = useAuth()
    const router = useRouter()
    const [clientsData, setClientsData] = useState<ClientAnalyticsData[]>([])
    const [selectedClient, setSelectedClient] = useState<string>('all')
    const [selectedPeriod, setSelectedPeriod] = useState<string>('12months')
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'invoices'>('revenue')

    // Load and calculate client analytics data
    useEffect(() => {
        const loadClientAnalytics = () => {
            try {
                setLoading(true)

                // Load all data
                const clients = loadData("clients", {})
                const allInvoices = loadData<SimpleInvoice[]>("invoices", [])
                const monthlyRevenues = loadData<ClientMonthlyRevenue[]>("monthlyRevenues", [])

                // Convert clients object to array if needed
                const clientsArray = Array.isArray(clients) ? clients : Object.values(clients)

                // Calculate analytics for each client
                const analyticsData: ClientAnalyticsData[] = clientsArray.map((client: any) => {
                    // Filter invoices for this client
                    const clientInvoices = allInvoices.filter(invoice => invoice.clientId === client.id)

                    // Calculate totals
                    const totalInvoices = clientInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
                    const pendingInvoices = clientInvoices
                        .filter(invoice => invoice.status === 'pending')
                        .reduce((sum, invoice) => sum + invoice.total, 0)

                    // Get monthly revenue data
                    const clientRevenue = monthlyRevenues.find(cr => cr.clientId === client.id)
                    const totalRevenue = clientRevenue?.revenues.reduce((sum, rev) => sum + rev.amount, 0) || 0

                    // Calculate profit
                    const totalProfit = totalRevenue - pendingInvoices

                    // Mock revenue change calculation (in real app, compare with previous period)
                    const revenueChange = Math.floor(Math.random() * 40) - 20 // Random between -20 and 20

                    return {
                        id: client.id,
                        name: client.name,
                        totalRevenue,
                        totalInvoices,
                        pendingInvoices,
                        totalProfit,
                        invoiceCount: clientInvoices.length,
                        revenueChange,
                        status: client.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
                        lastActivity: new Date(client.lastActivity || Date.now())
                    }
                })

                // Sort by selected criteria
                const sortedData = analyticsData.sort((a, b) => {
                    switch (sortBy) {
                        case 'revenue':
                            return b.totalRevenue - a.totalRevenue
                        case 'profit':
                            return b.totalProfit - a.totalProfit
                        case 'invoices':
                            return b.invoiceCount - a.invoiceCount
                        default:
                            return b.totalRevenue - a.totalRevenue
                    }
                })

                setClientsData(sortedData)
            } catch (error) {
                console.error('Error loading client analytics:', error)
            } finally {
                setLoading(false)
            }
        }

        loadClientAnalytics()
    }, [sortBy])

    // Calculate summary statistics
    const totalRevenue = clientsData.reduce((sum, client) => sum + client.totalRevenue, 0)
    const totalProfit = clientsData.reduce((sum, client) => sum + client.totalProfit, 0)
    const totalInvoices = clientsData.reduce((sum, client) => sum + client.invoiceCount, 0)
    const activeClients = clientsData.filter(client => client.status === 'active').length

    // Prepare chart data
    const chartData = clientsData.slice(0, 10).map(client => ({
        name: client.name.length > 12 ? client.name.substring(0, 12) + '...' : client.name,
        revenue: client.totalRevenue,
        profit: client.totalProfit,
        invoices: client.invoiceCount
    }))

    const pieChartData = clientsData.slice(0, 5).map(client => ({
        name: client.name,
        value: client.totalRevenue,
        percentage: ((client.totalRevenue / totalRevenue) * 100).toFixed(1)
    }))

    // Handle client selection
    const handleClientClick = (clientId: string) => {
        router.push(`/clients/${clientId}`)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Client Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {clientsData.length} clients
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${totalProfit.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            After pending invoices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeClients}</div>
                        <p className="text-xs text-muted-foreground">
                            {((activeClients / clientsData.length) * 100).toFixed(1)}% of total clients
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInvoices}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all clients
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value: 'revenue' | 'profit' | 'invoices') => setSortBy(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="profit">Profit</SelectItem>
                            <SelectItem value="invoices">Invoice Count</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="outline"
                    onClick={() => router.push('/clients')}
                    className="flex items-center gap-2"
                >
                    View All Clients <ExternalLink className="h-4 w-4" />
                </Button>
            </div>

            {/* Charts and Analysis */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Top Clients by Revenue
                        </CardTitle>
                        <CardDescription>Revenue comparison across your top clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                                <Bar dataKey="revenue" fill="#0088FE" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Revenue Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Revenue Distribution
                        </CardTitle>
                        <CardDescription>Revenue breakdown by top clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name} ${percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Client List */}
            <Card>
                <CardHeader>
                    <CardTitle>Client Performance Overview</CardTitle>
                    <CardDescription>Detailed view of all client metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {clientsData.map((client) => (
                            <div
                                key={client.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => handleClientClick(client.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{client.name}</h4>
                                            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                                                {client.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {client.invoiceCount} invoices
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                        <div className="font-medium">${client.totalRevenue.toLocaleString()}</div>
                                        <div className="text-muted-foreground">Revenue</div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`font-medium ${client.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${client.totalProfit.toLocaleString()}
                                        </div>
                                        <div className="text-muted-foreground">Profit</div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`flex items-center gap-1 font-medium ${client.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {client.revenueChange >= 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {Math.abs(client.revenueChange)}%
                                        </div>
                                        <div className="text-muted-foreground">Change</div>
                                    </div>

                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 