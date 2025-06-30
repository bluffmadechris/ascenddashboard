"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function InvoiceDebug() {
  const [invoices, setInvoices] = useState<any[]>([])
  const { user } = useAuth()
  const isOwner = user?.role === "owner"

  useEffect(() => {
    // Load all invoices from localStorage
    const loadInvoices = () => {
      try {
        const storedInvoices = localStorage.getItem("simple-invoices")
        if (storedInvoices) {
          const allInvoices = JSON.parse(storedInvoices)
          setInvoices(allInvoices)
        }
      } catch (error) {
        console.error("Error loading invoices:", error)
      }
    }

    loadInvoices()

    // Refresh when localStorage changes
    const handleStorageChange = () => {
      loadInvoices()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  if (!isOwner) return null

  // Group invoices by employee
  const employeeInvoices: Record<string, any[]> = {}
  invoices.forEach((invoice) => {
    if (!employeeInvoices[invoice.createdBy]) {
      employeeInvoices[invoice.createdBy] = []
    }
    employeeInvoices[invoice.createdBy].push(invoice)
  })

  return (
    <Card className="mt-6 border-dashed">
      <CardHeader>
        <CardTitle>Invoice Debug (Owner Only)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p>Total invoices in system: {invoices.length}</p>
          <p>User role: {user?.role}</p>
          <p>User email: {user?.email}</p>
          <p>Is owner: {isOwner ? "Yes" : "No"}</p>

          <div className="mt-4">
            <h4 className="font-medium">Invoices by Employee:</h4>
            {Object.entries(employeeInvoices).map(([employeeId, empInvoices]) => {
              const employeeName = empInvoices[0]?.createdByName || "Unknown"
              return (
                <div key={employeeId} className="mt-2">
                  <p>
                    {employeeName} ({empInvoices.length} invoices)
                  </p>
                  <ul className="ml-4 list-disc">
                    {empInvoices.map((inv) => (
                      <li key={inv.id}>
                        {inv.id}: {inv.name} - ${inv.total} - {inv.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
