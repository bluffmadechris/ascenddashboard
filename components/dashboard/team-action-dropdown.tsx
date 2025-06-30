"use client"

import { useState } from "react"
import { MoreHorizontal, UserMinus, Edit2, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { loadData, saveData } from "@/lib/data-persistence"

interface TeamActionDropdownProps {
  teamMember: any
  clientId?: string
  onUpdate?: () => void
}

export function TeamActionDropdown({ teamMember, clientId, onUpdate }: TeamActionDropdownProps) {
  const { toast } = useToast()
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [permissions, setPermissions] = useState(() => {
    if (clientId) {
      const access = teamMember.clientAccess?.find((a: any) => a.clientId === clientId)
      return {
        canInvoice: access?.canInvoice || false,
        canEdit: access?.canEdit || false
      }
    }
    return {
      canInvoice: false,
      canEdit: false
    }
  })

  const handleRemoveFromTeam = () => {
    try {
      // Load current team members
      const teamMembers = loadData("team-members", [])

      // Find the member to update
      const memberToUpdate = teamMembers.find((member: any) => member.id === teamMember.id)
      if (!memberToUpdate) {
        throw new Error("Team member not found")
      }

      // Only update the specific member's clientAccess
      const updatedTeamMembers = teamMembers.map((member: any) => {
        if (member.id === teamMember.id) {
          // Keep all other client access except the one being removed
          const updatedClientAccess = member.clientAccess.filter(
            (access: any) => access.clientId !== clientId
          )

          return {
            ...member,
            clientAccess: updatedClientAccess
          }
        }
        return member
      })

      // Save the updated team members
      saveData("team-members", updatedTeamMembers)

      // Create notification for the removed team member
      const notifications = loadData("notifications", [])
      const newNotification = {
        id: Math.random().toString(36).substring(7),
        userId: teamMember.id,
        title: "Removed from Client Team",
        message: `You have been removed from the client team.`,
        type: "team",
        read: false,
        createdAt: new Date().toISOString()
      }
      saveData("notifications", [...notifications, newNotification])

      toast({
        title: "Team member removed",
        description: `${teamMember.name} has been removed from the client.`
      })

      setIsRemoveDialogOpen(false)

      // Call the onUpdate callback
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error removing team member:", error)
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePermissionsUpdate = () => {
    try {
      const teamMembers = loadData("team-members", [])
      const updatedTeamMembers = teamMembers.map((member: any) => {
        if (member.id === teamMember.id) {
          return {
            ...member,
            clientAccess: member.clientAccess.map((access: any) => {
              if (access.clientId === clientId) {
                return {
                  ...access,
                  canInvoice: permissions.canInvoice,
                  canEdit: permissions.canEdit
                }
              }
              return access
            })
          }
        }
        return member
      })

      saveData("team-members", updatedTeamMembers)

      toast({
        title: "Permissions updated",
        description: "Team member permissions have been updated."
      })

      setIsPermissionsDialogOpen(false)

      // Call the onUpdate callback instead of dispatching storage event
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (!clientId) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsPermissionsDialogOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Permissions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsRemoveDialogOpen(true)} className="text-red-600">
            <UserMinus className="mr-2 h-4 w-4" />
            Remove from Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove from team dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {teamMember.name} from this client? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFromTeam}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit permissions dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {teamMember.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="can-invoice">Can Invoice</Label>
              <Switch
                id="can-invoice"
                checked={permissions.canInvoice}
                onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, canInvoice: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="can-edit">Can Edit</Label>
              <Switch
                id="can-edit"
                checked={permissions.canEdit}
                onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, canEdit: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePermissionsUpdate}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
