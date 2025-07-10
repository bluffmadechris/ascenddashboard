"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRoles } from "@/lib/roles-context"
import { useDisplayTitle } from "@/lib/display-title-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface CreateTeamMemberFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateTeamMemberForm({ onSuccess, onCancel }: CreateTeamMemberFormProps) {
  const { createUser } = useAuth()
  const { roles } = useRoles()
  const { updateDisplayTitle } = useDisplayTitle()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    title: "",
  })

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
      if (!formData.name || !formData.email || !formData.password) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!formData.role) {
        toast({
          title: "Error",
          description: "Please select a role.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create user
      console.log('Creating user with data:', formData)
      const newUser = await createUser(formData)

      // Set the display title if provided
      if (formData.title.trim() && newUser) {
        updateDisplayTitle(newUser.id.toString(), formData.title.trim())
      }

      toast({
        title: "Success",
        description: "Team member created successfully.",
      })
      onSuccess()
    } catch (error) {
      console.error('Create team member error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create team member.",
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

  console.log('Available roles:', roles)
  console.log('Form data:', formData)

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleInputChange}
              required
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
          {isSubmitting ? "Creating..." : "Create Team Member"}
        </Button>
      </div>
    </form>
  )
}
