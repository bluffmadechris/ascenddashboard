"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { loadData, saveData } from "@/lib/data-persistence"
import { generateId } from "@/lib/uuid"
import { format, isBefore } from "date-fns"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export type Project = {
  id: string
  name: string
  description: string
  status: "planning" | "active" | "completed" | "on-hold"
  priority: "low" | "medium" | "high"
  clientId?: string
  teamMembers: string[]
  startDate: string
  endDate: string
  budget?: string
  createdBy: string
  createdAt: string
  completedAt?: string
}

type CreateProjectFormProps = {
  onSuccess: () => void
  initialData?: Partial<Project>
  isEditing?: boolean
}

export function CreateProjectForm({ onSuccess, initialData, isEditing = false }: CreateProjectFormProps) {
  const { user, users, getAvailableClients } = useAuth()
  const { toast } = useToast()
  const clients = getAvailableClients()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.startDate ? new Date(initialData.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endDate ? new Date(initialData.endDate) : undefined,
  )
  const [dateError, setDateError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    status: initialData?.status || "planning",
    priority: initialData?.priority || "medium",
    clientId: initialData?.clientId || "",
    teamMembers: initialData?.teamMembers || [user?.id || ""],
    budget: initialData?.budget || "",
  })

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle team members selection
  const handleTeamMemberChange = (memberId: string) => {
    setFormData((prev) => {
      const teamMembers = [...prev.teamMembers]
      const index = teamMembers.indexOf(memberId)

      if (index === -1) {
        teamMembers.push(memberId)
      } else {
        teamMembers.splice(index, 1)
      }

      return { ...prev, teamMembers }
    })
  }

  // Validate dates
  const validateDates = () => {
    setDateError(null)

    if (startDate && endDate) {
      if (isBefore(endDate, startDate)) {
        setDateError("End date cannot be earlier than start date")
        return false
      }
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate form
    if (!formData.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a project name",
        variant: "destructive",
      })
      return
    }

    if (formData.teamMembers.length === 0) {
      toast({
        title: "Missing team members",
        description: "Please select at least one team member",
        variant: "destructive",
      })
      return
    }

    // Validate dates
    if (!validateDates()) {
      toast({
        title: "Invalid dates",
        description: dateError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create project object
      const projectData: Project = {
        id: initialData?.id || generateId(),
        name: formData.name,
        description: formData.description,
        status: formData.status as Project["status"],
        priority: formData.priority as Project["priority"],
        clientId: formData.clientId || undefined,
        teamMembers: formData.teamMembers,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
        budget: formData.budget,
        createdBy: initialData?.createdBy || user.id,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        completedAt: initialData?.completedAt,
      }

      // Save project to localStorage
      const existingProjects: Project[] = loadData("projects", [])

      let updatedProjects: Project[]

      if (isEditing) {
        // Update existing project
        updatedProjects = existingProjects.map((p) => (p.id === projectData.id ? projectData : p))
      } else {
        // Add new project
        updatedProjects = [...existingProjects, projectData]
      }

      saveData("projects", updatedProjects)

      // Create notifications for team members
      const teamMembersToNotify = formData.teamMembers.filter((id) => id !== user.id)
      if (teamMembersToNotify.length > 0) {
        const notifications = loadData("notifications", [])
        const newNotifications = teamMembersToNotify.map((memberId) => ({
          id: generateId(),
          userId: memberId,
          title: isEditing ? "Project Updated" : "New Project Assignment",
          message: `${isEditing ? "Project updated" : "You have been assigned to a new project"}: ${formData.name}`,
          type: "project",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/tasks-projects",
        }))

        saveData("notifications", [...notifications, ...newNotifications])
      }

      // Show success message
      toast({
        title: isEditing ? "Project updated" : "Project created",
        description: isEditing
          ? "The project has been updated successfully."
          : "The project has been created successfully.",
      })

      // Call success callback
      onSuccess()
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter project name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter project description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="clientId">Client (Optional)</Label>
        <Select value={formData.clientId} onValueChange={(value) => handleSelectChange("clientId", value)}>
          <SelectTrigger id="clientId">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Team Members</Label>
        <div className="border rounded-md p-3 mt-1 space-y-2 max-h-48 overflow-y-auto">
          {users.map((member) => (
            <div key={member.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`member-${member.id}`}
                checked={formData.teamMembers.includes(member.id)}
                onChange={() => handleTeamMemberChange(member.id)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor={`member-${member.id}`} className="cursor-pointer">
                {member.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedDatePicker
          label="Start Date"
          date={startDate}
          onDateChange={(date) => {
            setStartDate(date)
            validateDates()
          }}
          placeholder="Select start date"
          error={dateError && dateError.includes("start") ? dateError : undefined}
        />

        <EnhancedDatePicker
          label="End Date"
          date={endDate}
          onDateChange={(date) => {
            setEndDate(date)
            validateDates()
          }}
          placeholder="Select end date"
          error={dateError && dateError.includes("end") ? dateError : undefined}
          minDate={startDate}
          disabledDates={(date) => (startDate ? isBefore(date, startDate) : false)}
        />
      </div>

      {dateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{dateError}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="budget">Budget (Optional)</Label>
        <Input
          id="budget"
          name="budget"
          value={formData.budget}
          onChange={handleInputChange}
          placeholder="e.g., $5,000"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  )
}
