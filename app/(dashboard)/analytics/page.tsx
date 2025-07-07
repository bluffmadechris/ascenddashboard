"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfitStatsManager } from "@/components/dashboard/profit-stats-manager"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { BarChart, TrendingUp, DollarSign } from "lucide-react"

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

            {/* Profit Statistics */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Profit Statistics
                </h2>
                <ProfitStatsManager />
            </div>

            {/* Additional Analytics Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Reports & Insights</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Revenue Trends</CardTitle>
                            <CardDescription>Month-over-month revenue analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Detailed revenue tracking and forecasting tools will be available here.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Client Performance</CardTitle>
                            <CardDescription>Client profitability metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Client-specific revenue and project performance analytics.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Team Productivity</CardTitle>
                            <CardDescription>Team performance insights</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Team member productivity and project completion metrics.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 