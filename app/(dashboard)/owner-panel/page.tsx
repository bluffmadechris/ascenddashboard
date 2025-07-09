"use client"

import { useState, useEffect, useMemo } from "react"
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
import { PasswordChangeRequestsList } from "@/components/dashboard/password-change-requests-list"
import { StrikesManagement } from "@/components/dashboard/strikes-management"

import { Shield, Users, BarChart, UserPlus, Bell, LockKeyhole, AlertTriangle } from "lucide-react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Button } from "@/components/ui/button"
import { TeamProfileEditor } from "@/components/dashboard/team-profile-editor"
import { SendNotificationForm } from "@/components/dashboard/send-notification"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface OwnerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeClients: number;
  totalEmployees: number;
}

export default function OwnerPanelPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [stats, setStats] = useState<OwnerStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
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
          totalRevenue: Number((response.data as any).totalRevenue) || 0,
          monthlyRevenue: Number((response.data as any).monthlyRevenue) || 0,
          activeClients: Number((response.data as any).activeClients) || 0,
          totalEmployees: Number((response.data as any).totalEmployees) || 0
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
    toast.error("Access Denied: Only owners and admins can access this page.")
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
    toast.success("Team Member Created successfully.")
    setActiveTab("team-members")
    router.push("/owner-panel?tab=team-members", { scroll: false })
  }

  const handleUpdateMemberSuccess = () => {
    toast.success("Team Member Updated successfully.")
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
    toast.success("Role Created successfully.")
    setActiveTab("roles")
    router.push("/owner-panel?tab=roles", { scroll: false })
  }

  const handleUpdateRoleSuccess = () => {
    toast.success("Role Updated successfully.")
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

  // Memoize heavy tab content
  const dashboardTabContent = useMemo(() => (
    <TabsContent value="dashboard" className="mt-6">
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
  ), [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Owner Panel</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger
            value="dashboard"
            onClick={() => setActiveTab("dashboard")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <BarChart className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            onClick={() => setActiveTab("roles")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <Shield className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
            <span className="sm:hidden">Roles</span>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            onClick={() => setActiveTab("team")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          <TabsTrigger
            value="onboarding"
            onClick={() => setActiveTab("onboarding")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
            <span className="sm:hidden">New</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            onClick={() => setActiveTab("notifications")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notif</span>
          </TabsTrigger>
          <TabsTrigger
            value="password-requests"
            onClick={() => setActiveTab("password-requests")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <LockKeyhole className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Password Requests</span>
            <span className="sm:hidden">Pass</span>
          </TabsTrigger>
          <TabsTrigger
            value="strikes"
            onClick={() => setActiveTab("strikes")}
            className="hover:bg-primary/5 data-[state=active]:bg-primary/10"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Strikes</span>
            <span className="sm:hidden">Strikes</span>
          </TabsTrigger>
        </TabsList>

        {dashboardTabContent}

        <TabsContent value="roles" className="mt-6">
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

        <TabsContent value="team" className="mt-6">
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

        <TabsContent value="onboarding" className="mt-6">
          {/* Onboarding content */}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
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

        <TabsContent value="password-requests" className="mt-6">
          <PasswordChangeRequestsList />
        </TabsContent>

        <TabsContent value="strikes" className="mt-6">
          <StrikesManagement />
        </TabsContent>
      </Tabs>

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
