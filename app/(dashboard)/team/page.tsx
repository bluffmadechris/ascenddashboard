"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useDisplayTitle } from "@/lib/display-title-context"
import { TeamMemberCard } from "@/components/dashboard/team-member-card"
import { RequestMeetingButton } from "@/components/dashboard/request-meeting-button"
import { loadData } from "@/lib/data-persistence"
import { TeamMemberCalendar } from "@/components/calendar/team-member-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Calendar, Filter, Crown, Building, Palette, GitBranch } from "lucide-react"
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

export default function TeamPage() {
  const { users } = useAuth()
  const { getDisplayTitle } = useDisplayTitle()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState<"list" | "org">("org")
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [visibilityStates, setVisibilityStates] = useState<Record<string, boolean>>({})
  const [filterRole, setFilterRole] = useState<string | null>(null)

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
    loadData("team-visibility-states", newStates)
  }

  // Filter users based on search query and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ("bio" in user && typeof (user as any).bio === "string" && (user as any).bio.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesRole = !filterRole || user.role === filterRole

    return matchesSearch && matchesRole
  })

  // Get unique roles for filtering
  const uniqueRoles = Array.from(new Set(users.map((user) => user.role)))

  // Get user category for styling
  const getUserCategory = (userRole: string): string => {
    if (userRole === "owner" || userRole === "president" || userRole === "ceo") {
      return "owner"
    }
    if (
      userRole === "manager" ||
      userRole === "youtube_manager" ||
      userRole.includes("manager") ||
      userRole.includes("director") ||
      userRole.includes("lead")
    ) {
      return "management"
    }
    return "creative"
  }

  // Get role color based on category
  const getRoleColor = (category: string): string => {
    switch (category) {
      case "owner":
        return "bg-purple-100 dark:bg-purple-950/40"
      case "management":
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
      case "owner":
        return "👑"
      case "management":
        return "📊"
      case "creative":
        return "✨"
      default:
        return "🔹"
    }
  }

  // Organize users by hierarchy
  const organizeByHierarchy = (users: any[]) => {
    const owners = users.filter(user => getUserCategory(user.role) === "owner")
      .sort((a, b) => a.name.localeCompare(b.name))

    const management = users.filter(user => getUserCategory(user.role) === "management")
      .sort((a, b) => a.name.localeCompare(b.name))

    const creative = users.filter(user => getUserCategory(user.role) === "creative")
      .sort((a, b) => a.name.localeCompare(b.name))

    return { owners, management, creative }
  }

  // Sort users for grid view (fallback)
  const sortedUsers = filteredUsers.sort((a, b) => {
    const getRolePriority = (role: string) => {
      if (role === "owner" || role === "president" || role === "ceo") return 1
      if (role.includes("manager") || role.includes("director") || role.includes("lead")) return 2
      return 3
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
        displayTitle={getDisplayTitle(user.id, user.role)}
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

  const { owners, management, creative } = organizeByHierarchy(filteredUsers)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Team</h1>
        <div className="flex gap-2">
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
            owners,
            <Crown className="h-6 w-6 text-purple-600" />,
            "Company leadership and decision makers"
          )}

          {renderHierarchySection(
            "Management",
            management,
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
