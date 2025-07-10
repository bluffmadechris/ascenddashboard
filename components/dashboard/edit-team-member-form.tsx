"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRoles } from "@/lib/roles-context"
import { useDisplayTitle } from "@/lib/display-title-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface EditTeamMemberFormProps {
  memberId: string
  onSuccess: () => void
  onCancel: () => void
}

export function EditTeamMemberForm({ memberId, onSuccess, onCancel }: EditTeamMemberFormProps) {
  const { users, updateUser } = useAuth()
  const { roles } = useRoles()
  const { getDisplayTitle, updateDisplayTitle } = useDisplayTitle()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    title: "",
  })

  // Load user data
  useEffect(() => {
    const member = users.find((u) => u.id === memberId)
    if (member) {
      const currentTitle = getDisplayTitle(member.id, member.role)
      setFormData({
        name: member.name,
        email: member.email,
        password: "", // Don't load the password
        role: member.role,
        title: currentTitle,
      })
    }
  }, [memberId, users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
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

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password
      }

      // Update user
      const success = await updateUser(memberId, updateData)

      if (success) {
        // Update the display title separately
        if (formData.title.trim()) {
          updateDisplayTitle(memberId, formData.title.trim())
        }

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

  if (roles.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading roles...</p>
        <Button variant="outline" onClick={onCancel} className="mt-4">
          Cancel
        </Button>
      </div>
    )
  }

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

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter job title (e.g., Creative Director, Senior Designer)"
            value={formData.title}
            onChange={handleInputChange}
          />
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
            <Select value={formData.role} onValueChange={handleRoleChange}>
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
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Team Member"}
        </Button>
      </div>
    </form>
  )
}
