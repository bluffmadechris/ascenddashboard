"use client"

import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientsList } from "@/components/dashboard/clients-list"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
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

export default function ClientsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    status: "Active",
    projects: "0",
    totalSpent: "$0.00",
    contactPerson: "",
    contactEmail: "",
    logo: "",
  })

  // Redirect restricted users to their specific client page
  useEffect(() => {
    if (user && user.role === "employee") {
      const allowedClient = user.clientAccess.find((access) => access.canView)
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
      status: formData.status,
      projects: Number.parseInt(formData.projects, 10) || 0,
      totalSpent: formData.totalSpent,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
    }

    // Add the client to the list
    setClients((prevClients) => [...prevClients, newClient])

    // Show success message
    toast({
      title: "Client added successfully",
      description: `${formData.name} has been added to your clients.`,
    })

    // Reset form and close dialog
    setFormData({
      name: "",
      industry: "",
      status: "Active",
      projects: "0",
      totalSpent: "$0.00",
      contactPerson: "",
      contactEmail: "",
      logo: "",
    })
    setOpen(false)
  }

  // Handle client deletion
  const handleClientDelete = (clientId, updatedClients) => {
    setClients(updatedClients)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage all your clients.</p>
        </div>
        {user?.role === "owner" && (
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage all your clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsList initialClients={clients} onClientDelete={handleClientDelete} />
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="projects">Projects</Label>
                <Input
                  type="number"
                  id="projects"
                  name="projects"
                  placeholder="0"
                  value={formData.projects}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="totalSpent">Total Spent</Label>
                <Input
                  type="text"
                  id="totalSpent"
                  name="totalSpent"
                  placeholder="$0.00"
                  value={formData.totalSpent}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="contactPerson">Contact Person*</Label>
                <Input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  placeholder="Enter contact name"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="contactEmail">Contact Email*</Label>
                <Input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  placeholder="Enter contact email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
