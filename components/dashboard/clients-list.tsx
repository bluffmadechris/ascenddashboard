"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Building2, Search, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { AddClientForm } from "./add-client-form"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Trash, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loadData, saveData } from "@/lib/data-persistence"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { EditClientDialog } from "./edit-client-dialog"
import { useAuth } from "@/lib/auth-context"

interface Client {
  id: string
  name: string
  logo: string
  industry: string
  status: string
}

interface ClientsListProps {
  initialClients?: Client[]
  onClientDelete?: (clientId: string, updatedClients: Client[]) => void
}

export function ClientsList({ initialClients = [], onClientDelete }: ClientsListProps) {
  const router = useRouter()
  const { user, isApiConnected } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { toast } = useToast()

  const isOwner = user?.role === "owner"

  const loadClients = useCallback(async () => {
    const defaultClients: Record<string, Client> = {
      capri: {
        id: "capri",
        name: "Capri",
        logo: "/placeholder.svg?key=capri",
        industry: "Entertainment",
        status: "Active",
      },
      "piper-rockelle": {
        id: "piper-rockelle",
        name: "Piper Rockelle",
        logo: "/placeholder.svg?key=piper",
        industry: "Content Creation",
        status: "Active",
      },
      paryeet: {
        id: "paryeet",
        name: "Paryeet",
        logo: "/placeholder.svg?key=paryeet",
        industry: "Digital Media",
        status: "Active",
      },
      "lacy-vods": {
        id: "lacy-vods",
        name: "Lacy VODS",
        logo: "/placeholder.svg?key=lacy",
        industry: "Video Production",
        status: "Active",
      },
    }

    try {
      if (isApiConnected) {
        // Load clients from API
        const response = await apiClient.getClients()
        if (response.success && response.data?.clients) {
          // Transform API clients to match frontend format
          const apiClients = response.data.clients.map(client => ({
            id: client.id.toString(),
            name: client.name,
            logo: `/placeholder.svg?key=${client.name.toLowerCase()}`,
            industry: client.company || "Unknown",
            status: client.status || "Active",
          }))
          setClients(apiClients)
        } else {
          // Fall back to default clients if API fails
          setClients(Object.values(defaultClients))
        }
      } else {
        // Load from localStorage
        const storedClients = loadData<Record<string, Client>>("clients", {})
        const allClients = { ...defaultClients, ...storedClients }
        const clientsArray = Object.values(allClients)
        setClients(clientsArray)
      }
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading clients:", error)
      // Fall back to default clients on error
      setClients(Object.values(defaultClients))
      setIsLoading(false)
    }
  }, [isApiConnected])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const handleDelete = useCallback(async (clientId: string) => {
    try {
      if (isApiConnected) {
        // Use API to delete client
        const response = await apiClient.deleteClient(parseInt(clientId))

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete client')
        }

        toast({
          title: "Client deleted",
          description: "The client has been permanently removed.",
        })
      } else {
        // Fall back to localStorage deletion
        const updatedClients = clients.filter((client) => client.id !== clientId)
        setClients(updatedClients)

        const clientsRecord = updatedClients.reduce((acc, client) => {
          acc[client.id] = client
          return acc
        }, {} as Record<string, Client>)
        saveData("clients", clientsRecord)

        toast({
          title: "Client deleted",
          description: "The client has been removed from your dashboard.",
        })
      }

      // Update local state regardless of API or localStorage
      const updatedClients = clients.filter((client) => client.id !== clientId)
      setClients(updatedClients)

      if (onClientDelete) {
        onClientDelete(clientId, updatedClients)
      }

    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error deleting client",
        description: "There was a problem deleting the client. Please try again.",
        variant: "destructive"
      })
    }
  }, [clients, onClientDelete, toast, isApiConnected])

  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase()
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.industry?.toLowerCase().includes(searchLower) ||
      client.status?.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">Loading clients...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <AddClientForm onClientAdded={loadClients} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No clients found. Add a client to get started.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Clients</CardTitle>
        <AddClientForm onClientAdded={loadClients} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No clients found matching your search" : "No clients yet"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Get started by adding your first client
              </p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={client.logo} alt={client.name} />
                        <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                          {client.name}
                        </Link>
                        <span className="text-sm text-muted-foreground">ID: {client.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.industry}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`h-2 w-2 rounded-full mr-2 ${client.status === "Active"
                          ? "bg-green-500"
                          : client.status === "Paused"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                          }`}
                      />
                      {client.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClient(client)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {selectedClient && (
        <EditClientDialog
          client={selectedClient}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={loadClients}
        />
      )}
    </Card>
  )
}
