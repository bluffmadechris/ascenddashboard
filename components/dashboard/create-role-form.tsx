"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface CreateRoleFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateRoleForm({ onSuccess, onCancel }: CreateRoleFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Mock permissions - in a real app, these would come from your context
  const availablePermissions = [
    { id: "manage_users", name: "Manage Users", description: "Create, edit, and delete users" },
    { id: "manage_content", name: "Manage Content", description: "Create, edit, and delete content" },
    { id: "view_reports", name: "View Reports", description: "Access and view reports" },
    { id: "manage_settings", name: "Manage Settings", description: "Change system settings" },
    { id: "view_content", name: "View Content", description: "View content but not edit" },
  ]

  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({})

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

      // In a real app, you would call a function to create the role
      // await createRole({ ...formData, permissions })

      toast({
        title: "Success",
        description: "Role created successfully.",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Role Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter role name"
            value={formData.name}
            onChange={handleInputChange}
            required
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
          />
        </div>

        <div className="space-y-2">
          <Label>
            Permissions <span className="text-destructive">*</span>
          </Label>
          <div className="rounded-md border p-4">
            <div className="space-y-4">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions[permission.id] || false}
                    onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked === true)}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Role"}
        </Button>
      </div>
    </form>
  )
}
