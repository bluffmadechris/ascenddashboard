"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ImageIcon, UserRound, Briefcase } from "lucide-react"

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

interface EditClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated: (updatedClient: Client) => void
}

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    logo: "",
    status: "",
    projects: 0,
    totalSpent: "",
    contactPerson: "",
    contactEmail: "",
  })
  const { toast } = useToast()

  // Initialize form data when client changes or dialog opens
  useEffect(() => {
    if (client && open) {
      setFormData({
        logo: client.logo,
        status: client.status,
        projects: client.projects,
        totalSpent: client.totalSpent.replace("$", "").replace(",", ""),
        contactPerson: client.contactPerson,
        contactEmail: client.contactEmail,
      })
    }
  }, [client, open])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // Format the total spent value
    const formattedTotalSpent = `$${Number.parseFloat(formData.totalSpent).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

    // Create updated client data
    const updatedClient = {
      ...client,
      logo: formData.logo,
      status: formData.status,
      projects: Number(formData.projects),
      totalSpent: formattedTotalSpent,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
    }

    // Call the update callback
    onClientUpdated(updatedClient)

    // Close the dialog
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client: {client.name}</DialogTitle>
          <DialogDescription>Make changes to the client information. Click save when you're done.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              <span>Contact</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4">
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
          </TabsContent>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="status">Client Status</Label>
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
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 pt-4">
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
