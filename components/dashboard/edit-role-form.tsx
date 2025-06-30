"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface EditRoleFormProps {
  roleId: string
  onSuccess: () => void
  onCancel: () => void
}

export function EditRoleForm({ roleId, onSuccess, onCancel }: EditRoleFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Mock roles data - in a real app, this would come from your roles context
  const roles = [
    {
      id: "owner",
      name: "Owner",
      description: "Full access to all resources",
      isSystem: true,
      permissions: ["all"],
    },
    {
      id: "admin",
      name: "Administrator",
      description: "Administrative access to the system",
      isSystem: true,
      permissions: ["manage_users", "manage_content", "view_reports"],
    },
    {
      id: "editor",
      name: "Editor",
      description: "Can edit content but not manage users",
      isSystem: false,
      permissions: ["manage_content"],
    },
    {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access to content",
      isSystem: false,
      permissions: ["view_content"],
    },
  ]

  // Mock permissions - in a real app, these would come from your context
  const availablePermissions = [
    { id: "manage_users", name: "Manage Users", description: "Create, edit, and delete users" },
    { id: "manage_content", name: "Manage Content", description: "Create, edit, and delete content" },
    { id: "view_reports", name: "View Reports", description: "Access and view reports" },
    { id: "manage_settings", name: "Manage Settings", description: "Change system settings" },
    { id: "view_content", name: "View Content", description: "View content but not edit" },
  ]

  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({})

  // Load role data - FIX: Added proper dependency array and moved role finding outside useEffect
  const role = roles.find((r) => r.id === roleId)

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
      })

      // Set selected permissions
      const permissionsMap: Record<string, boolean> = {}
      if (role.permissions.includes("all")) {
        availablePermissions.forEach((permission) => {
          permissionsMap[permission.id] = true
        })
      } else {
        role.permissions.forEach((permissionId) => {
          permissionsMap[permissionId] = true
        })
      }
      setSelectedPermissions(permissionsMap)
    }
  }, [roleId]) // FIX: Only depend on roleId, not role or availablePermissions

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setSelectedPermissions((prev) => ({ ...prev, [permissionId]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Please provide a role name.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Get selected permissions
      const permissions = Object.entries(selectedPermissions)
        .filter(([_, selected]) => selected)
        .map(([permissionId]) => permissionId)

      if (permissions.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one permission.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // In a real app, you would call a function to update the role
      // await updateRole(roleId, { ...formData, permissions })

      toast({
        title: "Success",
        description: "Role updated successfully.",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if this is a system role
  const isSystemRole = role?.isSystem || false

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSystemRole && (
        <div className="rounded-md bg-yellow-50 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">System Role</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a system role and cannot be modified. System roles are essential for the proper functioning of
                  the application.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter role name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isSystemRole}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter role description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            disabled={isSystemRole}
          />
        </div>

        <div className="space-y-2">
          <Label>Permissions</Label>
          <div className="rounded-md border p-4">
            <div className="space-y-4">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions[permission.id] || false}
                    onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked === true)}
                    disabled={isSystemRole}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={`permission-${permission.id}`} className="font-medium">
                      {permission.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isSystemRole}>
          {isSubmitting ? "Updating..." : "Update Role"}
        </Button>
      </div>
    </form>
  )
}
