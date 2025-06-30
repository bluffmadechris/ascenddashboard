"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRoles } from "@/lib/roles-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface EditTeamMemberFormProps {
  memberId: string
  onSuccess: () => void
  onCancel: () => void
}

export function EditTeamMemberForm({ memberId, onSuccess, onCancel }: EditTeamMemberFormProps) {
  const { users, updateUser, getAvailableClients } = useAuth()
  const { roles } = useRoles()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  })

  const availableClients = getAvailableClients()
  const [selectedClients, setSelectedClients] = useState<Record<string, boolean>>({})
  const [clientPermissions, setClientPermissions] = useState<
    Record<string, { canView: boolean; canEdit: boolean; canInvoice: boolean }>
  >({})

  // Load user data
  useEffect(() => {
    const member = users.find((u) => u.id === memberId)
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        password: "", // Don't load the password
        role: member.role,
      })

      // Set selected clients and permissions
      const clientSelections: Record<string, boolean> = {}
      const permissions: Record<string, { canView: boolean; canEdit: boolean; canInvoice: boolean }> = {}

      member.clientAccess.forEach((access) => {
        clientSelections[access.clientId] = true
        permissions[access.clientId] = {
          canView: access.canView,
          canEdit: access.canEdit,
          canInvoice: access.canInvoice,
        }
      })

      setSelectedClients(clientSelections)
      setClientPermissions(permissions)
    }
  }, [memberId, users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleClientToggle = (clientId: string, checked: boolean) => {
    setSelectedClients((prev) => ({ ...prev, [clientId]: checked }))

    // Initialize permissions if client is selected
    if (checked && !clientPermissions[clientId]) {
      setClientPermissions((prev) => ({
        ...prev,
        [clientId]: { canView: true, canEdit: false, canInvoice: false },
      }))
    }
  }

  const handlePermissionToggle = (
    clientId: string,
    permission: "canView" | "canEdit" | "canInvoice",
    checked: boolean,
  ) => {
    setClientPermissions((prev) => ({
      ...prev,
      [clientId]: { ...prev[clientId], [permission]: checked },
    }))

    // If canEdit or canInvoice is enabled, canView must be enabled
    if ((permission === "canEdit" || permission === "canInvoice") && checked) {
      setClientPermissions((prev) => ({
        ...prev,
        [clientId]: { ...prev[clientId], canView: true },
      }))
    }

    // If canView is disabled, canEdit and canInvoice must be disabled
    if (permission === "canView" && !checked) {
      setClientPermissions((prev) => ({
        ...prev,
        [clientId]: { ...prev[clientId], canEdit: false, canInvoice: false },
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.name || !formData.email) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Prepare client access data
      const clientAccess = Object.entries(selectedClients)
        .filter(([_, selected]) => selected)
        .map(([clientId]) => ({
          clientId,
          ...clientPermissions[clientId],
        }))

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        clientAccess,
      }

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password
      }

      // Update user
      const success = await updateUser(memberId, updateData)

      if (success) {
        toast({
          title: "Success",
          description: "Team member updated successfully.",
        })
        onSuccess()
      } else {
        throw new Error("Failed to update team member")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team member.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get role description
  const getRoleDescription = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    return role?.description || ""
  }

  const [role, setRole] = useState(formData.role)

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: role }))
  }, [role])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password (leave blank to keep current)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((roleOption) => (
                  <SelectItem key={roleOption.id} value={roleOption.id}>
                    {roleOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Client Access</Label>
          <div className="rounded-md border p-4">
            <div className="space-y-4">
              {availableClients.map((client) => (
                <div key={client.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`client-${client.id}`}
                      checked={selectedClients[client.id] || false}
                      onCheckedChange={(checked) => handleClientToggle(client.id, checked === true)}
                    />
                    <Label htmlFor={`client-${client.id}`} className="font-medium">
                      {client.name}
                    </Label>
                  </div>

                  {selectedClients[client.id] && (
                    <div className="ml-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}-view`}
                          checked={clientPermissions[client.id]?.canView || false}
                          onCheckedChange={(checked) => handlePermissionToggle(client.id, "canView", checked === true)}
                        />
                        <Label htmlFor={`client-${client.id}-view`}>Can View</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}-edit`}
                          checked={clientPermissions[client.id]?.canEdit || false}
                          disabled={!clientPermissions[client.id]?.canView}
                          onCheckedChange={(checked) => handlePermissionToggle(client.id, "canEdit", checked === true)}
                        />
                        <Label htmlFor={`client-${client.id}-edit`}>Can Edit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}-invoice`}
                          checked={clientPermissions[client.id]?.canInvoice || false}
                          disabled={!clientPermissions[client.id]?.canView}
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(client.id, "canInvoice", checked === true)
                          }
                        />
                        <Label htmlFor={`client-${client.id}-invoice`}>Can Invoice</Label>
                      </div>
                    </div>
                  )}
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
          {isSubmitting ? "Updating..." : "Update Team Member"}
        </Button>
      </div>
    </form>
  )
}
