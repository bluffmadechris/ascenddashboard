"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

type SimpleInvoice = {
  id: string
  description: string
  client_id: string
  client_name: string
  issue_date: string
  amount: number
  status: string
  created_by: string
  created_by_name: string
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function RecentInvoices() {
  const { user, isOwner } = useAuth()
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getInvoices()
        if (response.success) {
          // Get the 5 most recent invoices
          const recentInvoices = response.data.invoices
            .filter((invoice: SimpleInvoice) => isOwner || invoice.created_by === user?.id)
            .slice(0, 5)
          setInvoices(recentInvoices)
        }
      } catch (error) {
        console.error("Error fetching invoices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [user?.id, isOwner])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>{isOwner ? "Recent invoices from all employees" : "Your recent invoices"}</CardDescription>
        </div>
        <Link href="/invoices" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No recent invoices found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{invoice.description}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{format(new Date(invoice.issue_date), "MMM d, yyyy")}</p>
                    {isOwner && invoice.created_by !== user?.id && (
                      <Badge variant="outline" className="text-xs">
                        {invoice.created_by_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {typeof invoice.amount === 'number'
                        ? formatCurrency(invoice.amount)
                        : formatCurrency(parseFloat(invoice.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">{invoice.client_name || "No Client"}</p>
                  </div>
                  <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="capitalize">
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
