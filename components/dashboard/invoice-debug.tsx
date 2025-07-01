"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
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

export function InvoiceDebug() {
  const { user, isOwner } = useAuth()
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getInvoices()
        if (response.success) {
          setInvoices(response.data.invoices)
        }
      } catch (error) {
        console.error("Error fetching invoices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  // Group invoices by employee
  const employeeInvoices = invoices.reduce((acc: Record<string, SimpleInvoice[]>, invoice) => {
    if (!acc[invoice.created_by]) {
      acc[invoice.created_by] = []
    }
    acc[invoice.created_by].push(invoice)
    return acc
  }, {})

  if (!isOwner) {
    return null
  }

  return (
    <Card className="mt-6 border-dashed">
      <CardHeader>
        <CardTitle>Invoice Debug (Owner Only)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : (
          <div className="text-sm">
            <p>Total invoices in system: {invoices.length}</p>
            <p>User role: {user?.role}</p>
            <p>User email: {user?.email}</p>
            <p>Is owner: {isOwner ? "Yes" : "No"}</p>

            <div className="mt-4">
              <h4 className="font-medium">Invoices by Employee:</h4>
              {Object.entries(employeeInvoices).map(([employeeId, empInvoices]) => {
                const employeeName = empInvoices[0]?.created_by_name || "Unknown"
                return (
                  <div key={employeeId} className="mt-2">
                    <p>
                      {employeeName} ({empInvoices.length} invoices)
                    </p>
                    <ul className="ml-4 list-disc">
                      {empInvoices.map((inv) => (
                        <li key={inv.id}>
                          {inv.id}: {inv.description} - ${inv.amount.toFixed(2)} - {inv.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
