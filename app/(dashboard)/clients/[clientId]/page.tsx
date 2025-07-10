"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientTasks } from "@/components/dashboard/client-tasks"
import { ClientProjects } from "@/components/dashboard/client-projects"
import { PlusCircle, TrendingUp, DollarSign, FileText, BarChart, Users } from "lucide-react"
import { ClientTeamMembers } from "@/components/dashboard/client-team-members"
import { useAuth } from "@/lib/auth-context"
import { loadData, saveData } from "@/lib/data-persistence"
import { Button } from "@/components/ui/button"
import { EditClientDropdown } from "@/components/dashboard/edit-client-dropdown"
import { CreateTaskForm } from "@/components/dashboard/create-task-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { generateId } from "@/lib/uuid"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"



// Define client type
type Client = {
  id: string
  name: string
  logo: string
  industry: string
  status: string
  contactPerson: string
  contactEmail: string
}

// Update the User type to include all necessary fields
interface ClientAccess {
  clientId: string
  canView: boolean
  canEdit: boolean
  canInvoice: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  bio?: string
  clientAccess: ClientAccess[]
}

export default function ClientPage({ params }: { params: { clientId: string } }) {
  const [clientData, setClientData] = useState<Client | null>(null)
  const { user, hasClientAccess, users } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()
  const router = useRouter()



  // Add task dialog state and handlers
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  // Add state for team member dialog
  const [isAddTeamMemberOpen, setIsAddTeamMemberOpen] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState("")

  // Load client data
  useEffect(() => {
    // Default client data
    const defaultClients: Record<string, Client> = {
      capri: {
        id: "capri",
        name: "Capri",
        logo: "/placeholder.svg?key=capri",
        industry: "Entertainment",
        status: "Active",
        contactPerson: "Alex Johnson",
        contactEmail: "alex@capri.com",
      },
      "piper-rockelle": {
        id: "piper-rockelle",
        name: "Piper Rockelle",
        logo: "/placeholder.svg?key=piper",
        industry: "Content Creation",
        status: "Active",
        contactPerson: "Sarah Miller",
        contactEmail: "sarah@piperrockelle.com",
      },
      paryeet: {
        id: "paryeet",
        name: "Paryeet",
        logo: "/placeholder.svg?key=paryeet",
        industry: "Digital Media",
        status: "Active",
        contactPerson: "Michael Brown",
        contactEmail: "michael@paryeet.com",
      },
      "lacy-vods": {
        id: "lacy-vods",
        name: "Lacy VODS",
        logo: "/placeholder.svg?key=lacy",
        industry: "Video Production",
        status: "Active",
        contactPerson: "Emily Chen",
        contactEmail: "emily@lacyvods.com",
      },
    }

    // Try to load client data from storage
    const storedClients = loadData<Record<string, Client>>("clients", {})

    // Merge default clients with stored clients
    const allClients = { ...defaultClients, ...storedClients }

    // Get the client data for this client ID
    const client = allClients[params.clientId]

    if (client) {
      setClientData(client)
    } else {
      // Fallback to default client data if not found
      setClientData(
        defaultClients[params.clientId] || {
          id: params.clientId,
          name: "Unknown Client",
          logo: "/placeholder.svg",
          industry: "Unknown",
          status: "Inactive",
          contactPerson: "Unknown",
          contactEmail: "unknown@example.com",
        },
      )
    }
  }, [params.clientId, refreshKey])



  // Handle client update
  const handleClientUpdate = (updatedClient: Client) => {
    setClientData(updatedClient)
    setRefreshKey((prev) => prev + 1)
  }

  // Add task dialog handlers
  const handleTaskCreated = () => {
    setIsTaskDialogOpen(false)
  }

  // Function to handle adding team member
  const handleAddTeamMember = () => {
    try {
      if (!selectedTeamMember) {
        toast({
          title: "No team member selected",
          description: "Please select a team member to add.",
          variant: "destructive",
        })
        return
      }

      // Get current team members, initialize with empty array if no data exists
      const teamMembers = (loadData("team-members", []) || []) as User[]

      // Find the selected member from users array since they might not be in team-members yet
      const selectedUser = users.find((u) => u.id === selectedTeamMember) as User | undefined
      if (!selectedUser) {
        throw new Error("Selected team member not found")
      }

      // Check if member already exists in team-members
      const existingMemberIndex = teamMembers.findIndex((m) => m.id === selectedTeamMember)

      if (existingMemberIndex >= 0) {
        // Update existing member
        const existingMember = teamMembers[existingMemberIndex]
        const existingAccess = existingMember.clientAccess || []

        // Check if already has access to this client
        if (!existingAccess.some((access) => access.clientId === params.clientId)) {
          const updatedMember: User = {
            ...existingMember,
            clientAccess: [
              ...existingAccess,
              {
                clientId: params.clientId,
                canView: true,
                canEdit: false,
                canInvoice: false
              }
            ]
          }
          teamMembers[existingMemberIndex] = updatedMember
        }
      } else {
        // Add new member
        const newMember: User = {
          ...selectedUser,
          clientAccess: [{
            clientId: params.clientId,
            canView: true,
            canEdit: false,
            canInvoice: false
          }]
        }
        teamMembers.push(newMember)
      }

      // Save updated team members
      saveData("team-members", teamMembers)

      toast({
        title: "Team member added",
        description: `${selectedUser.name} has been added to the client.`
      })

      setIsAddTeamMemberOpen(false)
      setSelectedTeamMember("")

      // Trigger a refresh of the team members list
      window.dispatchEvent(new Event("team-member-update"))
    } catch (error) {
      console.error("Error adding team member:", error)
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!clientData) {
    return <div>Loading client data...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{clientData.name}</h1>
          <p className="text-muted-foreground">Client ID: {params.clientId}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/analytics?tab=management')}
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            Manage Finances
          </Button>
          <EditClientDropdown client={clientData} onClientUpdated={handleClientUpdate} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">3 tasks pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">assigned to client</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Recent projects for this client.</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientProjects clientId={params.clientId} limit={5} />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common actions for this client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/analytics?tab=management')}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Manage Revenue & Invoices
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsTaskDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Task
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsAddTeamMemberOpen(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Client Tasks</CardTitle>
                <CardDescription>View and manage all tasks for this client.</CardDescription>
              </div>
              <Button onClick={() => setIsTaskDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </CardHeader>
            <CardContent>
              <ClientTasks clientId={params.clientId} />
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage team members for this client.</CardDescription>
              </div>
              <Button onClick={() => setIsAddTeamMemberOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>
              <ClientTeamMembers clientId={params.clientId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add task dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Create a new task for this client.</DialogDescription>
          </DialogHeader>
          <CreateTaskForm
            onTaskCreated={handleTaskCreated}
            onCancel={() => setIsTaskDialogOpen(false)}
            clientId={params.clientId}
          />
        </DialogContent>
      </Dialog>

      {/* Add Team Member Dialog */}
      <Dialog open={isAddTeamMemberOpen} onOpenChange={setIsAddTeamMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a team member to add to this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter((u: User) => !u.clientAccess?.some((access) => access.clientId === params.clientId))
                  .map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddTeamMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeamMember}>
              Add Team Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
