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

export default function TeamPage() {
  const { users } = useAuth()
  const { getDisplayTitle } = useDisplayTitle()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState<"hierarchy" | "org-chart" | "grid" | "calendar">("hierarchy")
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
      (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))

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
        displayTitle={getDisplayTitle(user.id)}
        actionButton={
          selectedView === "calendar" ? (
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
        contactInfo={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {showContactInfo ? "Contact visible" : "Contact hidden"}
            </span>
            <Switch
              checked={showContactInfo}
              onCheckedChange={(checked) => {
                handleToggleVisibility(user.id)
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Toggle contact information visibility"
              className="scale-75 data-[state=checked]:bg-primary/80"
            />
          </div>
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-[300px]"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[120px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterRole ? "Filtered" : "Filter"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setFilterRole(null)}>All Roles</DropdownMenuItem>
                {uniqueRoles.map((role) => (
                  <DropdownMenuItem key={role} onClick={() => setFilterRole(role)}>
                    {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={selectedView === "hierarchy" ? "default" : "outline"}
              onClick={() => setSelectedView("hierarchy")}
              className="w-[120px]"
            >
              <Building className="mr-2 h-4 w-4" />
              Team View
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-lg font-medium">No team members found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderHierarchySection(
              "Leadership Team",
              owners,
              <Crown className="h-6 w-6 text-purple-600" />,
              "Company owners, presidents, and executive leadership"
            )}

            {renderHierarchySection(
              "Management Team",
              management,
              <Building className="h-6 w-6 text-blue-600" />,
              "Managers, directors, and team leads overseeing departments"
            )}

            {renderHierarchySection(
              "Creative Team",
              creative,
              <Palette className="h-6 w-6 text-amber-600" />,
              "Designers, editors, content creators, and specialists"
            )}
          </div>
        )}
      </div>
    </div>
  )
}
