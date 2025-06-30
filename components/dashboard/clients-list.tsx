"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Pencil, Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { ImageIcon, UserRound, Briefcase } from "lucide-react"

// Default clients data
const defaultClients = [
  {
    id: "capri",
    name: "Capri",
    logo: "/placeholder.svg?key=capri",
    industry: "Entertainment",
    status: "Active",
    projects: 4,
    totalSpent: "$32,500.00",
    contactPerson: "Alex Johnson",
    contactEmail: "alex@capri.com",
  },
  {
    id: "piper-rockelle",
    name: "Piper Rockelle",
    logo: "/placeholder.svg?key=piper",
    industry: "Content Creation",
    status: "Active",
    projects: 3,
    totalSpent: "$28,000.00",
    contactPerson: "Sarah Miller",
    contactEmail: "sarah@piperrockelle.com",
  },
  {
    id: "paryeet",
    name: "Paryeet",
    logo: "/placeholder.svg?key=paryeet",
    industry: "Digital Media",
    status: "Active",
    projects: 2,
    totalSpent: "$15,500.00",
    contactPerson: "Michael Brown",
    contactEmail: "michael@paryeet.com",
  },
  {
    id: "lacy-vods",
    name: "Lacy VODS",
    logo: "/placeholder.svg?key=lacy",
    industry: "Video Production",
    status: "Active",
    projects: 3,
    totalSpent: "$22,000.00",
    contactPerson: "Emily Chen",
    contactEmail: "emily@lacyvods.com",
  },
]

export function ClientsList({ initialClients = [], onClientDelete = null }) {
  const { toast } = useToast()
  // Use initialClients if provided, otherwise use defaultClients
  const [clients, setClients] = useState(initialClients.length > 0 ? initialClients : defaultClients)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    logo: "",
    status: "",
    projects: 0,
    totalSpent: "",
    contactPerson: "",
    contactEmail: "",
  })

  const handleEditClient = (client) => {
    setClientToEdit(client)
    setFormData({
      logo: client.logo,
      status: client.status,
      projects: client.projects,
      totalSpent: client.totalSpent.replace("$", "").replace(",", ""),
      contactPerson: client.contactPerson,
      contactEmail: client.contactEmail,
    })
    setIsEditDialogOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveClient = () => {
    if (clientToEdit) {
      // Format the total spent value
      const formattedTotalSpent = `$${Number.parseFloat(formData.totalSpent).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

      // Create updated client data
      const updatedClient = {
        ...clientToEdit,
        logo: formData.logo,
        status: formData.status,
        projects: Number(formData.projects),
        totalSpent: formattedTotalSpent,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
      }

      // Update clients list
      const updatedClients = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c))
      setClients(updatedClients)

      // Call the onClientDelete callback if provided (we're reusing this for updates)
      if (onClientDelete) {
        onClientDelete(updatedClient.id, updatedClients)
      }

      // Show success toast
      toast({
        title: "Client updated",
        description: `${updatedClient.name} has been updated successfully.`,
        duration: 3000,
      })

      // Close the dialog
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteClient = (client) => {
    setClientToDelete(client)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (clientToDelete) {
      // Filter out the client to delete
      const updatedClients = clients.filter((client) => client.id !== clientToDelete.id)
      setClients(updatedClients)

      // Call the onClientDelete callback if provided
      if (onClientDelete) {
        onClientDelete(clientToDelete.id, updatedClients)
      }

      // Show success toast
      toast({
        title: "Client deleted",
        description: `${clientToDelete.name} has been removed successfully.`,
        duration: 3000,
      })

      // Reset state
      setClientToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const cancelDelete = () => {
    setClientToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  return (
    <div>
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={client.logo || "/placeholder.svg"} alt={client.name} />
                      <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        {client.name}
                      </Link>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{client.industry}</TableCell>
                <TableCell>
                  <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                </TableCell>
                <TableCell>{client.projects}</TableCell>
                <TableCell>{client.totalSpent}</TableCell>
                <TableCell>{client.contactPerson}</TableCell>
                <TableCell>{client.contactEmail}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/clients/${client.id}`}>
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View Client</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClient(client)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit Client</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Client</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {clientToDelete?.name} and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client: {clientToEdit?.name}</DialogTitle>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClient}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
