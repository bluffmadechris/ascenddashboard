"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import Link from "next/link"
import { loadData } from "@/lib/data-persistence"

type SimpleInvoice = {
  id: string
  name: string
  clientId: string
  clientName: string
  date: Date
  total: number
  status: string
  createdBy: string
  createdByName: string
}

export function RecentInvoices() {
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Check if the user is an owner (any owner, not just specific email)
  const isOwner = user?.role === "owner"

  useEffect(() => {
    const loadInvoices = () => {
      try {
        const allInvoices = loadData<SimpleInvoice[]>("invoices", [])

        if (!Array.isArray(allInvoices)) {
          console.error("Expected allInvoices to be an array, got:", typeof allInvoices)
          setInvoices([])
          return
        }

        let filteredInvoices = [...allInvoices]

        // For non-owners, only show their own invoices
        if (!isOwner) {
          filteredInvoices = filteredInvoices.filter((invoice) => invoice.createdBy === user?.id)
        }

        // Sort by date (newest first)
        filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Take only the 5 most recent
        setInvoices(filteredInvoices.slice(0, 5))
      } catch (error) {
        console.error("Error loading invoices:", error)
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()

    // Listen for storage events to refresh the list
    const handleStorageChange = () => {
      loadInvoices()
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [user, isOwner])

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
                  <p className="text-sm font-medium">{invoice.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{format(new Date(invoice.date), "MMM d, yyyy")}</p>
                    {isOwner && invoice.createdBy !== user?.id && (
                      <Badge variant="outline" className="text-xs">
                        {invoice.createdByName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">${invoice.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
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
