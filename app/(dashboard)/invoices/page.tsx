"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleInvoicesList } from "@/components/dashboard/simple-invoices-list"
import { SimpleInvoiceForm } from "@/components/dashboard/simple-invoice-form"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Clock, CheckCircle, CreditCard } from "lucide-react"
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

export default function InvoicesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()
  const [employeeInvoices, setEmployeeInvoices] = useState<Record<string, SimpleInvoice[]>>({})

  // Replace the existing Tabs component with this updated version that reads the URL parameter
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("tab") || "all"
    }
    return "all"
  })

  // Add this effect to update the URL when tab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", activeTab)
      window.history.replaceState({}, "", url.toString())
    }
  }, [activeTab])

  // Check if the user is an owner (any owner, not just specific email)
  const isOwner = user?.role === "owner"

  // Function to refresh the invoice list
  const refreshInvoices = () => {
    setRefreshKey((prevKey) => prevKey + 1)
    // Trigger storage event to refresh other components
    window.dispatchEvent(new Event("storage"))
  }

  // Load and organize employee invoices for owner view
  useEffect(() => {
    if (!isOwner) return

    const loadEmployeeInvoices = () => {
      try {
        // Use our new loadData function with a default empty array
        const allInvoices = loadData<SimpleInvoice[]>("invoices", [])

        // Make sure allInvoices is an array before using forEach
        if (!Array.isArray(allInvoices)) {
          console.error("Expected allInvoices to be an array, got:", typeof allInvoices)
          setEmployeeInvoices({})
          return
        }

        // Group invoices by employee
        const byEmployee: Record<string, SimpleInvoice[]> = {}

        allInvoices.forEach((invoice: SimpleInvoice) => {
          // Skip owner's own invoices
          if (invoice.createdBy === user?.id) return

          if (!byEmployee[invoice.createdBy]) {
            byEmployee[invoice.createdBy] = []
          }
          byEmployee[invoice.createdBy].push(invoice)
        })

        setEmployeeInvoices(byEmployee)
      } catch (error) {
        console.error("Error loading employee invoices:", error)
      }
    }

    loadEmployeeInvoices()

    const handleStorageChange = () => {
      loadEmployeeInvoices()
    }

    window.addEventListener("storage", handleStorageChange)

    // Also set up a polling mechanism to ensure we catch all changes
    const intervalId = setInterval(() => {
      loadEmployeeInvoices()
    }, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(intervalId)
    }
  }, [isOwner, user?.id])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            {isOwner ? "Manage all invoices from all employees." : "Manage your invoices and payments."}
          </p>
        </div>
        <SimpleInvoiceForm onInvoiceCreated={refreshInvoices} />
      </div>
      {isOwner && (
        <Alert variant="default" className="bg-primary/10 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertTitle>Owner Dashboard</AlertTitle>
          <AlertDescription>
            You are viewing the owner dashboard. You can see and manage all invoices from all employees.
          </AlertDescription>
        </Alert>
      )}
      {isOwner ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              New
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              Paid
            </TabsTrigger>
            <TabsTrigger value="my">My Invoices</TabsTrigger>
            <TabsTrigger value="employees">Employee Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>View and manage all invoices from all employees.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`all-${refreshKey}`} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  New Invoices
                </CardTitle>
                <CardDescription>All newly created invoices awaiting approval.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`new-${refreshKey}`} filterBy={{ status: "new" }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Approved Invoices
                </CardTitle>
                <CardDescription>All approved invoices awaiting payment.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`approved-${refreshKey}`} filterBy={{ status: "approved" }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Paid Invoices
                </CardTitle>
                <CardDescription>All invoices that have been paid.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`paid-${refreshKey}`} filterBy={{ status: "paid" }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my">
            <Card>
              <CardHeader>
                <CardTitle>My Invoices</CardTitle>
                <CardDescription>Invoices you've created personally.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`my-${refreshKey}`} filterBy={{ createdBy: user?.id }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <div className="space-y-6">
              {Object.entries(employeeInvoices).length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <h3 className="text-lg font-medium">No employee invoices found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        When employees create invoices, they will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(employeeInvoices).map(([employeeId, invoices]) => {
                  if (invoices.length === 0) return null

                  const employeeName = invoices[0]?.createdByName || "Unknown Employee"

                  return (
                    <Card key={employeeId}>
                      <CardHeader>
                        <CardTitle>{employeeName}'s Invoices</CardTitle>
                        <CardDescription>{invoices.length} invoice(s) created by this employee</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SimpleInvoicesList
                          key={`employee-${employeeId}-${refreshKey}`}
                          filterBy={{ createdBy: employeeId }}
                        />
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // For non-owner users, show a simplified view with only their invoices
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All My Invoices</TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              New
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              Paid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>My Invoices</CardTitle>
                <CardDescription>View and manage your invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`all-${refreshKey}`} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  New Invoices
                </CardTitle>
                <CardDescription>Your newly created invoices awaiting approval.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`new-${refreshKey}`} filterBy={{ status: "new" }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Approved Invoices
                </CardTitle>
                <CardDescription>Your approved invoices awaiting payment.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`approved-${refreshKey}`} filterBy={{ status: "approved" }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Paid Invoices
                </CardTitle>
                <CardDescription>Your invoices that have been paid.</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleInvoicesList key={`paid-${refreshKey}`} filterBy={{ status: "paid" }} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
