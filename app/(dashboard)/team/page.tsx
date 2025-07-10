"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRoles } from "@/lib/roles-context"
import { TeamMemberCard } from "@/components/dashboard/team-member-card"
import { RequestMeetingButton } from "@/components/dashboard/request-meeting-button"
import { loadData, saveData } from "@/lib/data-persistence"
import { TeamMemberCalendar } from "@/components/calendar/team-member-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Calendar, Filter, Crown, Building, Palette } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getStrikeStatus } from "@/lib/strikes-system"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TeamHierarchyDisplay } from "@/components/dashboard/team-hierarchy-display"
import { TeamMembersList } from "@/components/dashboard/team-members-list"
import { OrgChart } from "@/components/org-chart/org-chart"
import { OrgChartGrid } from "@/components/org-chart/org-chart-grid"
import { isValidAvatarUrl } from "@/lib/utils"

export default function TeamPage() {
  const { users, refreshUsers, user: currentUser, isApiConnected } = useAuth()
  const { roles, getRole } = useRoles()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState<"list" | "org">("org")
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [visibilityStates, setVisibilityStates] = useState<Record<string, boolean>>({})
  const [filterRole, setFilterRole] = useState<string | null>(null)

  // Debug logging for current user and users array
  useEffect(() => {
    console.log('Team page - Current user:', currentUser?.name, currentUser?.role, currentUser?.id)
    console.log('Team page - All users:', users.map(u => ({ name: u.name, role: u.role, id: u.id })))
    console.log('Team page - Current user in users array:', users.find(u => u.id === currentUser?.id) ? 'YES' : 'NO')
  }, [users, currentUser])

  // Refresh users when component mounts to ensure fresh data
  useEffect(() => {
    console.log('🔄 Team page - initial refreshUsers call')
    refreshUsers('teamPageInitial')

    // Force a second refresh after a short delay to ensure we get the latest data
    const timeoutId = setTimeout(() => {
      console.log('🔄 Team page - second refreshUsers call (1000ms delay)')
      refreshUsers('teamPageSecond')
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  // Also refresh when the component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Team page - refreshUsers on visibility change')
        refreshUsers('teamPageVisibility')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshUsers])

  // Normalize user data to ensure avatar field is properly set
  const normalizedUsers = users.map(user => ({
    ...user,
    avatar: user.avatar || (user as any).avatar_url || ""
  }))

  // Load visibility states from local storage
  useEffect(() => {
    const savedStates = loadData("team-visibility-states", {})
    setVisibilityStates(savedStates)
  }, [])

  // Save visibility states to local storage
  const handleToggleVisibility = (userId: string) => {
    const newStates = {
      ...visibilityStates,
      [userId]: !visibilityStates[userId],
    }
    setVisibilityStates(newStates)
    saveData("team-visibility-states", newStates)
  }

  // Filter users based on search query and role filter (use normalized users)
  const filteredUsers = normalizedUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ("bio" in user && typeof (user as any).bio === "string" && (user as any).bio.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesRole = !filterRole || user.role === filterRole

    return matchesSearch && matchesRole
  })

  // Get unique roles for filtering (use normalized users)
  const uniqueRoles = Array.from(new Set(normalizedUsers.map((user) => user.role)))

  // Get user category based on actual role system
  const getUserCategory = (userRole: string): string => {
    // Get the role definition from the role system
    const roleDefinition = getRole(userRole)

    // First, check direct role string matches (most reliable)
    const roleStr = userRole.toLowerCase()

    // Leadership roles
    if (roleStr === "owner" || roleStr === "ceo" || roleStr === "president" || roleStr === "founder") {
      return "leadership"
    }

    // Manager roles
    if (roleStr === "admin" || roleStr === "manager" || roleStr === "youtube_manager" ||
      roleStr.includes("manager") || roleStr.includes("director") || roleStr.includes("lead")) {
      return "managers"
    }

    // If we have a role definition, use its properties
    if (roleDefinition) {
      // Leadership: Owner role
      if (roleDefinition.id === "owner" || roleDefinition.name.toLowerCase().includes("owner") ||
        roleDefinition.name.toLowerCase().includes("ceo") || roleDefinition.name.toLowerCase().includes("president")) {
        return "leadership"
      }

      // Managers: Admin role or roles with "manager" in the name
      if (roleDefinition.id === "admin" || roleDefinition.name.toLowerCase().includes("manager") ||
        roleDefinition.name.toLowerCase().includes("director") || roleDefinition.name.toLowerCase().includes("lead")) {
        return "managers"
      }

      // Creative Team: Employee role or other creative roles
      return "creative"
    }

    // Creative roles (default for most other roles)
    return "creative"
  }

  // Get role color based on category
  const getRoleColor = (category: string): string => {
    switch (category) {
      case "leadership":
        return "bg-purple-100 dark:bg-purple-950/40"
      case "managers":
        return "bg-blue-100 dark:bg-blue-950/40"
      case "creative":
        return "bg-amber-100 dark:bg-amber-950/40"
      default:
        return "bg-gray-100 dark:bg-gray-800"
    }
  }

  // Get role icon based on category
  const getRoleIcon = (category: string): string => {
    switch (category) {
      case "leadership":
        return "👑"
      case "managers":
        return "📊"
      case "creative":
        return "✨"
      default:
        return "🔹"
    }
  }

  // Organize users by hierarchy in the correct order
  const organizeByHierarchy = (users: any[]) => {
    const leadership = users.filter(user => getUserCategory(user.role) === "leadership")
      .sort((a, b) => a.name.localeCompare(b.name))

    const managers = users.filter(user => getUserCategory(user.role) === "managers")
      .sort((a, b) => a.name.localeCompare(b.name))

    const creative = users.filter(user => getUserCategory(user.role) === "creative")
      .sort((a, b) => a.name.localeCompare(b.name))

    return { leadership, managers, creative }
  }

  // Sort users for grid view (fallback)
  const sortedUsers = filteredUsers.sort((a, b) => {
    const getRolePriority = (role: string) => {
      const category = getUserCategory(role)
      if (category === "leadership") return 1
      if (category === "managers") return 2
      if (category === "creative") return 3
      return 4
    }

    const priorityA = getRolePriority(a.role)
    const priorityB = getRolePriority(b.role)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return a.name.localeCompare(b.name)
  })

  const renderTeamMemberCard = (user: any) => {
    const category = getUserCategory(user.role)
    const strikeStatus = getStrikeStatus(user.id)
    const showContactInfo = visibilityStates[user.id] || false

    return (
      <TeamMemberCard
        key={user.id}
        user={user}
        showContactInfo={showContactInfo}
        onToggleVisibility={() => handleToggleVisibility(user.id)}
        roleColor={getRoleColor(category)}
        roleIcon={getRoleIcon(category)}
        actionButton={
          selectedView === "list" ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSelectedMember(user.id)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          ) : (
            <RequestMeetingButton
              memberId={user.id}
              disabled={strikeStatus.isCritical}
              className="w-full"
            />
          )
        }
      />
    )
  }

  const renderHierarchySection = (title: string, users: any[], icon: React.ReactNode, description: string) => {
    if (users.length === 0) return null

    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {icon}
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {users.length} {users.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map(renderTeamMemberCard)}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { leadership, managers, creative } = organizeByHierarchy(filteredUsers)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Team</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refreshUsers('manualRefresh')
            }}
            size="sm"
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.reload()
            }}
            size="sm"
          >
            Refresh Avatars
          </Button>
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            onClick={() => setSelectedView("list")}
          >
            List View
          </Button>
          <Button
            variant={selectedView === "org" ? "default" : "outline"}
            onClick={() => setSelectedView("org")}
          >
            Organization View
          </Button>
        </div>
      </div>

      {selectedView === "list" ? (
        <TeamMembersList />
      ) : (
        <div className="space-y-6">
          {renderHierarchySection(
            "Leadership",
            leadership,
            <Crown className="h-6 w-6 text-purple-600" />,
            "Company leadership and decision makers"
          )}

          {renderHierarchySection(
            "Managers",
            managers,
            <Building className="h-6 w-6 text-blue-600" />,
            "Department heads and team leaders"
          )}

          {renderHierarchySection(
            "Creative Team",
            creative,
            <Palette className="h-6 w-6 text-amber-600" />,
            "Content creators and specialists"
          )}
        </div>
      )}
    </div>
  )
}
