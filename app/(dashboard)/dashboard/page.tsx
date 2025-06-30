"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { UpcomingEvents } from "@/components/dashboard/news-section"
import { MeetingNotifications } from "@/components/dashboard/meeting-notifications"
import { IncomeReport } from "@/components/dashboard/income-report"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()

  // Check if user is owner
  const isOwner = user?.role === "owner" || user?.email === "dylandzn00@gmail.com"

  // Listen for storage events to refresh the dashboard
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your Ascend Media dashboard.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isOwner && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <DashboardStats key={`stats-${refreshKey}`} />

          {/* Meeting Notifications */}
          <MeetingNotifications />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <UpcomingEvents />
            </div>
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invoices</CardTitle>
                  <CardDescription>Invoices awaiting payment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentInvoices key={`invoices-${refreshKey}`} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {isOwner && (
          <TabsContent value="analytics" className="space-y-4">
            <IncomeReport />
          </TabsContent>
        )}

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and download reports for your business.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Reports dashboard coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
