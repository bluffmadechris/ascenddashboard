"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamMembersList } from "@/components/dashboard/team-members-list"
import { CreateTeamMemberForm } from "@/components/dashboard/create-team-member-form"
import { EditTeamMemberForm } from "@/components/dashboard/edit-team-member-form"
import { RolesList } from "@/components/dashboard/roles-list"
import { CreateRoleForm } from "@/components/dashboard/create-role-form"
import { EditRoleForm } from "@/components/dashboard/edit-role-form"

import { useToast } from "@/components/ui/use-toast"
import { Shield, Users, BarChart, UserPlus, Bell } from "lucide-react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Button } from "@/components/ui/button"
import { TeamProfileEditor } from "@/components/dashboard/team-profile-editor"
import { SendNotificationForm } from "@/components/dashboard/send-notification"
import { ProfitStatsManager } from "@/components/dashboard/profit-stats-manager"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface OwnerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalProfit: number;
  monthlyProfit: number;
  activeClients: number;
  totalEmployees: number;
}

export default function OwnerPanelPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [stats, setStats] = useState<OwnerStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalProfit: 0,
    monthlyProfit: 0,
    activeClients: 0,
    totalEmployees: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Check URL parameters on load
  useEffect(() => {
    const tab = searchParams.get("tab")
    const editMemberId = searchParams.get("edit")
    const isNewMember = searchParams.get("new") === "true"
    const editRoleId = searchParams.get("editRole")
    const isNewRole = searchParams.get("newRole") === "true"

    if (tab) {
      setActiveTab(tab)
    }

    if (editMemberId) {
      setSelectedMemberId(editMemberId)
      setActiveTab("edit-member")
    } else if (isNewMember) {
      setActiveTab("create-member")
    } else if (editRoleId) {
      setSelectedRoleId(editRoleId)
      setActiveTab("edit-role")
    } else if (isNewRole) {
      setActiveTab("create-role")
    }
  }, [searchParams])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/owner/stats')
        // Ensure all numeric values are properly converted to numbers
        const data = {
          totalRevenue: Number(response.data.totalRevenue) || 0,
          monthlyRevenue: Number(response.data.monthlyRevenue) || 0,
          totalProfit: Number(response.data.totalProfit) || 0,
          monthlyProfit: Number(response.data.monthlyProfit) || 0,
          activeClients: Number(response.data.activeClients) || 0,
          totalEmployees: Number(response.data.totalEmployees) || 0
        }
        setStats(data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to fetch owner statistics")
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Redirect if not owner or admin
  if (user?.role !== "owner" && user?.role !== "admin") {
    toast({
      title: "Access Denied",
      description: "Only owners and admins can access this page.",
      variant: "destructive",
    })
    router.push("/dashboard")
    return null
  }

  const handleEditMember = (memberId: string) => {
    setSelectedMemberId(memberId)
    setActiveTab("edit-member")
    // Update URL without refreshing the page
    router.push(`/owner-panel?tab=edit-member&edit=${memberId}`, { scroll: false })
  }

  const handleCreateMemberSuccess = () => {
    toast({
      title: "Team Member Created",
      description: "The team member has been created successfully.",
    })
    setActiveTab("team-members")
    router.push("/owner-panel?tab=team-members", { scroll: false })
  }

  const handleUpdateMemberSuccess = () => {
    toast({
      title: "Team Member Updated",
      description: "The team member has been updated successfully.",
    })
    setActiveTab("team-members")
    router.push("/owner-panel?tab=team-members", { scroll: false })
  }

  const handleCancelEditMember = () => {
    setSelectedMemberId(null)
    setActiveTab("team-members")
    router.push("/owner-panel?tab=team-members", { scroll: false })
  }

  const handleCreateRole = () => {
    setActiveTab("create-role")
    router.push("/owner-panel?tab=create-role", { scroll: false })
  }

  const handleEditRole = (roleId: string) => {
    setSelectedRoleId(roleId)
    setActiveTab("edit-role")
    router.push(`/owner-panel?tab=edit-role&editRole=${roleId}`, { scroll: false })
  }

  const handleCreateRoleSuccess = () => {
    toast({
      title: "Role Created",
      description: "The role has been created successfully.",
    })
    setActiveTab("roles")
    router.push("/owner-panel?tab=roles", { scroll: false })
  }

  const handleUpdateRoleSuccess = () => {
    toast({
      title: "Role Updated",
      description: "The role has been updated successfully.",
    })
    setActiveTab("roles")
    router.push("/owner-panel?tab=roles", { scroll: false })
  }

  const handleCancelEditRole = () => {
    setSelectedRoleId(null)
    setActiveTab("roles")
    router.push("/owner-panel?tab=roles", { scroll: false })
  }

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Owner Panel</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 sm:w-[600px]">
          <TabsTrigger value="dashboard" onClick={() => router.push("/owner-panel?tab=dashboard", { scroll: false })}>
            <BarChart className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="team-members"
            onClick={() => router.push("/owner-panel?tab=team-members", { scroll: false })}
          >
            <Users className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger
            value="team-profiles"
            onClick={() => router.push("/owner-panel?tab=team-profiles", { scroll: false })}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Team Profiles
          </TabsTrigger>
          <TabsTrigger value="roles" onClick={() => router.push("/owner-panel?tab=roles", { scroll: false })}>
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="notifications" onClick={() => router.push("/owner-panel?tab=notifications", { scroll: false })}>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Owner Dashboard</CardTitle>
              <CardDescription>Overview of your organization's key metrics and activities.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardStats />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team-members" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team members, their roles, and client access permissions.</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setActiveTab("create-member")
                  router.push("/owner-panel?tab=create-member", { scroll: false })
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create New Team Member
              </Button>
            </CardHeader>
            <CardContent>
              <TeamMembersList onEditMember={handleEditMember} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Profiles Tab */}
        <TabsContent value="team-profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Member Profiles</CardTitle>
              <CardDescription>
                Edit team member profiles including names, titles, bios, and avatars. Changes will be immediately
                reflected on the team page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamProfileEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-member" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Team Member</CardTitle>
              <CardDescription>Add a new team member to your organization and set their permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTeamMemberForm onSuccess={handleCreateMemberSuccess} onCancel={handleCancelEditMember} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-member" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Team Member</CardTitle>
              <CardDescription>Update team member details, role, and client access permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMemberId && (
                <EditTeamMemberForm
                  memberId={selectedMemberId}
                  onSuccess={handleUpdateMemberSuccess}
                  onCancel={handleCancelEditMember}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Create and manage custom roles with specific permissions that can be assigned to team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesList onCreateRole={handleCreateRole} onEditRole={handleEditRole} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-role" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Role</CardTitle>
              <CardDescription>
                Define a new role with specific permissions that can be assigned to team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateRoleForm onSuccess={handleCreateRoleSuccess} onCancel={handleCancelEditRole} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-role" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Role</CardTitle>
              <CardDescription>Modify role details and permissions. System roles cannot be edited.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRoleId && (
                <EditRoleForm
                  roleId={selectedRoleId}
                  onSuccess={handleUpdateRoleSuccess}
                  onCancel={handleCancelEditRole}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Notifications</CardTitle>
              <CardDescription>
                Send notifications to all team members. They will see these in their notification panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendNotificationForm />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <div className="grid gap-6">
        <ProfitStatsManager />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalProfit)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.monthlyProfit)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalEmployees}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
