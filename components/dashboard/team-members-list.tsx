"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface TeamMembersListProps {
  onEditMember?: (memberId: string) => void
}

export function TeamMembersList({ onEditMember }: TeamMembersListProps) {
  const { users, user: currentUser, deleteUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)

  // Filter out the current user (owner) from the list
  const teamMembers = users.filter((u) => u.id !== currentUser?.id)

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (memberToDelete) {
      const success = await deleteUser(memberToDelete)
      if (success) {
        toast({
          title: "Team Member Deleted",
          description: "The team member has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete team member.",
          variant: "destructive",
        })
      }
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    }
  }

  const handleEditClick = (memberId: string) => {
    if (onEditMember) {
      // If onEditMember is provided, use it
      onEditMember(memberId)
    } else {
      // Otherwise, show a toast and navigate to the team management page
      toast({
        title: "Edit Team Member",
        description: "Redirecting to team management page...",
      })
      router.push(`/team-management?edit=${memberId}`)
    }
  }

  const handleAddMemberClick = () => {
    if (onEditMember) {
      // If onEditMember is provided, use it with "new"
      onEditMember("new")
    } else {
      // Otherwise, show a toast and navigate to the team management page
      toast({
        title: "Add Team Member",
        description: "Redirecting to team management page...",
      })
      router.push("/team-management?new=true")
    }
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

  const formatRoleName = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div>
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Client Access</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UserPlus className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No team members found</p>
                    <Button variant="outline" size="sm" onClick={handleAddMemberClick}>
                      Add Team Member
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
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
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>{formatRoleName(member.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(member.clientAccess || []).map((access) => (
                        <Badge key={access.clientId} variant="outline" className="text-xs">
                          {access.clientId === "capri"
                            ? "Capri"
                            : access.clientId === "piper-rockelle"
                              ? "Piper Rockelle"
                              : access.clientId === "paryeet"
                                ? "Paryeet"
                                : access.clientId === "lacy-vods"
                                  ? "Lacy VODS"
                                  : access.clientId}
                        </Badge>
                      ))}
                      {(!member.clientAccess || member.clientAccess.length === 0) && (
                        <span className="text-xs text-muted-foreground">No client access</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(member.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(member.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
