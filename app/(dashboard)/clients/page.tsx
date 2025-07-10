"use client"

import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientsList } from "@/components/dashboard/clients-list"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, BarChart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadData, saveData } from "@/lib/data-persistence"

// Define client type
interface Client {
  id: string
  name: string
  logo: string
  industry: string
  status: string
  contactPerson: string
  contactEmail: string
}

export default function ClientsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    logo: "",
  })

  // Redirect restricted users to their specific client page
  useEffect(() => {
    if (user && user.role === "employee") {
      const allowedClient = user.clientAccess?.find((access) => access.canView)
      if (allowedClient) {
        redirect(`/clients/${allowedClient.clientId}`)
      }
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Create a new client object
    const newClient = {
      id: formData.name.toLowerCase().replace(/\s+/g, "-"),
      name: formData.name,
      logo: formData.logo || `/placeholder.svg?key=${formData.name.toLowerCase()}`,
      industry: formData.industry,
      status: "Active",
      contactPerson: "",
      contactEmail: "",
    }

    // Load existing clients
    const existingClients = loadData<Record<string, Client>>("clients", {})

    // Add the new client
    const updatedClients = {
      ...existingClients,
      [newClient.id]: newClient,
    }

    // Save to storage
    saveData("clients", updatedClients)

    // Show success message
    toast({
      title: "Client added successfully",
      description: `${formData.name} has been added to your clients.`,
    })

    // Reset form and close dialog
    setFormData({
      name: "",
      industry: "",
      logo: "",
    })
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage all your clients.</p>
        </div>
        <div className="flex gap-2">
          {user?.role === "owner" && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/analytics?tab=management'}
              className="flex items-center gap-2"
            >
              <BarChart className="mr-2 h-4 w-4" />
              Manage Finances
            </Button>
          )}
          {user?.role === "owner" && (
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage all your clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsList />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Fill in the details below to add a new client to your dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">Client Name*</Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Enter client name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="industry">Industry*</Label>
              <Select value={formData.industry} onValueChange={(value) => handleSelectChange("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Content Creation">Content Creation</SelectItem>
                  <SelectItem value="Digital Media">Digital Media</SelectItem>
                  <SelectItem value="Video Production">Video Production</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                type="text"
                id="logo"
                name="logo"
                placeholder="Enter logo URL (optional)"
                value={formData.logo}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">Leave blank to use a generated placeholder.</p>
            </div>

            <DialogFooter>
              <Button type="submit">Add Client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
