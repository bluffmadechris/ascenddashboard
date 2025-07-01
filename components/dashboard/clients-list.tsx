"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Default clients data
const defaultClients = [
  {
    id: "capri",
    name: "Capri",
    logo: "/placeholder.svg?key=capri",
    industry: "Entertainment",
  },
  {
    id: "piper-rockelle",
    name: "Piper Rockelle",
    logo: "/placeholder.svg?key=piper",
    industry: "Content Creation",
  },
  {
    id: "paryeet",
    name: "Paryeet",
    logo: "/placeholder.svg?key=paryeet",
    industry: "Digital Media",
  },
  {
    id: "lacy-vods",
    name: "Lacy VODS",
    logo: "/placeholder.svg?key=lacy",
    industry: "Video Production",
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
    industry: "",
  })

  const handleEditClient = (client) => {
    setClientToEdit(client)
    setFormData({
      logo: client.logo,
      industry: client.industry,
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
      // Create updated client data
      const updatedClient = {
        ...clientToEdit,
        logo: formData.logo,
        industry: formData.industry,
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
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {clientToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Make changes to the client information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="industry">Industry</Label>
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
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                placeholder="Enter logo URL"
              />
            </div>
          </div>
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
