"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamActionDropdown } from "@/components/dashboard/team-action-dropdown"
import { Badge } from "@/components/ui/badge"
import { UserPlus } from "lucide-react"
import { loadData } from "@/lib/data-persistence"

interface ClientTeamMembersProps {
  clientId: string
}

export function ClientTeamMembers({ clientId }: ClientTeamMembersProps) {
  const { users } = useAuth()
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  // Load team members for this client
  const loadTeamMembers = () => {
    try {
      // Get the stored team members data, fallback to users if no data
      const allTeamMembers = loadData("team-members", users)

      // Filter team members who have access to this client
      const clientTeamMembers = allTeamMembers.filter(user => {
        // Ensure clientAccess exists and is an array
        if (!Array.isArray(user.clientAccess)) {
          return false
        }
        // Check if user has access to this client
        return user.clientAccess.some((access: any) =>
          access.clientId === clientId &&
          // Ensure we have the basic access properties
          typeof access === 'object' &&
          access !== null
        )
      })

      setTeamMembers(clientTeamMembers)
    } catch (error) {
      console.error("Error loading team members:", error)
      setTeamMembers([])
    }
  }

  useEffect(() => {
    loadTeamMembers()

    // Create a custom event listener for team member updates
    const handleTeamUpdate = () => {
      loadTeamMembers()
    }

    window.addEventListener("team-member-update", handleTeamUpdate)
    return () => window.removeEventListener("team-member-update", handleTeamUpdate)
  }, [users, clientId])

  const formatRoleName = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "designer":
        return "outline"
      case "editor":
        return "secondary"
      case "youtube_manager":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No team members found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            teamMembers.map((member) => {
              const clientAccess = member.clientAccess?.find((access: any) => access.clientId === clientId)
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{member.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>{formatRoleName(member.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {clientAccess?.canEdit && (
                        <Badge variant="outline">Can Edit</Badge>
                      )}
                      {clientAccess?.canInvoice && (
                        <Badge variant="outline">Can Invoice</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TeamActionDropdown teamMember={member} clientId={clientId} onUpdate={loadTeamMembers} />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
