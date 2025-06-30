"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, ImageIcon, UserRound, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { loadData, saveData } from "@/lib/data-persistence"

type Client = {
  id: string
  name: string
  logo: string
  industry: string
  status: string
  projects: number
  totalSpent: string
  contactPerson: string
  contactEmail: string
}

interface EditClientDropdownProps {
  client: Client
  onClientUpdated: (updatedClient: Client) => void
}

export function EditClientDropdown({ client, onClientUpdated }: EditClientDropdownProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("profile")
  const [formData, setFormData] = useState({
    logo: client.logo,
    status: client.status,
    projects: client.projects,
    totalSpent: client.totalSpent.replace("$", "").replace(",", ""),
    contactPerson: client.contactPerson,
    contactEmail: client.contactEmail,
  })
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // Format the total spent value
    const formattedTotalSpent = `$${Number.parseFloat(formData.totalSpent).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

    // Create updated client data
    const updatedClient: Client = {
      ...client,
      logo: formData.logo,
      status: formData.status,
      projects: Number(formData.projects),
      totalSpent: formattedTotalSpent,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
    }

    // Save to storage
    const storedClients = loadData<Record<string, Client>>("clients", {})
    storedClients[client.id] = updatedClient
    saveData("clients", storedClients)

    // Call the update callback
    onClientUpdated(updatedClient)

    // Show success message
    toast({
      title: "Client updated",
      description: "The client information has been updated successfully.",
      duration: 3000,
    })

    // Close the dialog
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client Information</DialogTitle>
          <DialogDescription>Make changes to the client information. Click save when you're done.</DialogDescription>
        </DialogHeader>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${activeTab === "profile" ? "border-b-2 border-primary font-medium" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <ImageIcon className="mr-2 inline-block h-4 w-4" />
            Profile
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "details" ? "border-b-2 border-primary font-medium" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            <Briefcase className="mr-2 inline-block h-4 w-4" />
            Details
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "contact" ? "border-b-2 border-primary font-medium" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            <UserRound className="mr-2 inline-block h-4 w-4" />
            Contact
          </button>
        </div>

        <div className="py-4">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Profile Picture URL</Label>
                <Input
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="Enter logo URL"
                />
              </div>
              <div className="pt-4">
                <img
                  src={formData.logo || "/placeholder.svg"}
                  alt="Client logo preview"
                  className="mx-auto h-24 w-24 rounded-full object-cover"
                />
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Client Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
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
              <div className="space-y-2">
                <Label htmlFor="projects">Number of Projects</Label>
                <Input
                  id="projects"
                  name="projects"
                  type="number"
                  min="0"
                  value={formData.projects}
                  onChange={handleInputChange}
                  placeholder="Enter number of projects"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSpent">Total Spent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    id="totalSpent"
                    name="totalSpent"
                    className="pl-7"
                    value={formData.totalSpent}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="Enter contact person name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="Enter contact email"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
