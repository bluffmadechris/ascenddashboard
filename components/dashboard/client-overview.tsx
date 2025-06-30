"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, TrendingUp } from "lucide-react"
import { loadData } from "@/lib/data-persistence"
import { useAuth } from "@/lib/auth-context"

interface ClientOverviewProps {
    clientId: string
}

export function ClientOverview({ clientId }: ClientOverviewProps) {
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalInvoices, setTotalInvoices] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        const loadClientStats = () => {
            try {
                // Load client data
                const clients = loadData("clients", [])
                const client = clients.find((c: any) => c.id === clientId)

                if (!client) {
                    console.error("Client not found")
                    return
                }

                // Load all invoices for this client
                const allInvoices = loadData("invoices", [])
                const clientInvoices = allInvoices.filter((invoice: any) => invoice.clientId === clientId)

                // Calculate total from paid invoices
                const paidInvoicesTotal = clientInvoices
                    .filter((invoice: any) => invoice.status === "paid")
                    .reduce((sum: number, invoice: any) => sum + invoice.total, 0)

                // Set the stats
                setTotalRevenue(client.revenue || 0)
                setTotalInvoices(paidInvoicesTotal)
                setTotalProfit(client.revenue - paidInvoicesTotal)

            } catch (error) {
                console.error("Error loading client stats:", error)
            } finally {
                setLoading(false)
            }
        }

        loadClientStats()

        // Listen for storage events to refresh the stats
        const handleStorageChange = () => {
            loadClientStats()
        }

        window.addEventListener("storage", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [clientId])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total revenue from this client</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalInvoices.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total from paid invoices</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Revenue minus invoices</p>
                </CardContent>
            </Card>
        </div>
    )
} 