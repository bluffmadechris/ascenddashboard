"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancialAnalytics } from "@/components/dashboard/financial-analytics"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { BarChart, TrendingUp, DollarSign, Calculator, Target } from "lucide-react"

export default function AnalyticsPage() {
    const { user } = useAuth()
    const isOwner = user?.role === "owner"

    if (!isOwner) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            Only owners can access analytics data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            This page contains sensitive financial information that is only available to business owners.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-2">
                <BarChart className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">
                        Comprehensive financial insights and business metrics
                    </p>
                </div>
            </div>

            {/* Overview Stats */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overview
                </h2>
                <DashboardStats />
            </div>

            {/* Financial Analytics */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Financial Analytics
                </h2>
                <FinancialAnalytics />
            </div>

            {/* Additional Analytics Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Reports & Insights</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Revenue Trends
                            </CardTitle>
                            <CardDescription>Month-over-month revenue analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Track your revenue patterns and identify growth opportunities with detailed monthly breakdowns.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Profit Tracking
                            </CardTitle>
                            <CardDescription>Real-time profit balance monitoring</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Monitor your profit balance in real-time, including automatic deductions for paid invoices.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Expense Management
                            </CardTitle>
                            <CardDescription>Comprehensive expense tracking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Track all business expenses by category and analyze spending patterns to optimize costs.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 