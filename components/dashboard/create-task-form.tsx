"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { loadData, saveData } from "@/lib/data-persistence"
import { generateId } from "@/lib/uuid"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { syncTaskToCalendar } from "@/lib/calendar-sync"

export type Task = {
  id: string
  name: string
  description?: string
  priority: "low" | "medium" | "high"
  dueDate: string
  assignedTo: string
  clientId: string
  createdBy: string
  createdAt: string
  completedAt?: string
  status: "pending" | "in-progress" | "completed"
}

interface CreateTaskFormProps {
  onTaskCreated: () => void
  onCancel: () => void
  preselectedAssignee?: string
  clientId?: string
}

export function CreateTaskForm({ onTaskCreated, onCancel, preselectedAssignee, clientId }: CreateTaskFormProps) {
  const { user, users, getAvailableClients } = useAuth()
  const { toast } = useToast()
  const clients = getAvailableClients()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    assignedTo: preselectedAssignee || "",
    clientId: clientId || "",
    status: "pending",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate form
    if (!formData.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a task name",
        variant: "destructive",
      })
      return
    }

    if (!formData.assignedTo) {
      toast({
        title: "Missing assignee",
        description: "Please select a team member to assign the task to",
        variant: "destructive",
      })
      return
    }

    if (!dueDate) {
      toast({
        title: "Missing due date",
        description: "Please select a due date for the task",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create task object
      const taskData: Task = {
        id: generateId(),
        name: formData.name,
        description: formData.description,
        priority: formData.priority as Task["priority"],
        dueDate: format(dueDate, "yyyy-MM-dd"),
        assignedTo: formData.assignedTo,
        clientId: formData.clientId,
        status: formData.status as Task["status"],
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      }

      // Save task to localStorage
      const existingTasks: Task[] = loadData("tasks", [])
      const updatedTasks = [...existingTasks, taskData]
      saveData("tasks", updatedTasks)

      // Sync task to calendar
      const calendarSynced = syncTaskToCalendar({
        id: taskData.id,
        name: taskData.name,
        description: taskData.description,
        dueDate: taskData.dueDate,
        assignedTo: taskData.assignedTo
      })

      // Create notification for assignee
      if (taskData.assignedTo !== user.id) {
        const notifications = loadData("notifications", [])
        const assignedUser = users.find(u => u.id === taskData.assignedTo)
        const clientName = clients.find(c => c.id === taskData.clientId)?.name || "Unknown Client"

        const newNotification = {
          id: generateId(),
          userId: taskData.assignedTo,
          title: "New Task Assignment",
          message: `You have been assigned a new task: ${taskData.name} for ${clientName}, due on ${format(dueDate, "MMM d, yyyy")}`,
          type: "task",
          read: false,
          createdAt: new Date().toISOString(),
          link: `/clients/${taskData.clientId}?tab=tasks`,
        }
        saveData("notifications", [...notifications, newNotification])
      }

      // Show success toast with calendar sync status
      toast({
        title: "Task created",
        description: `${taskData.name} has been created and assigned to ${users.find((u) => u.id === taskData.assignedTo)?.name}. ${calendarSynced ? 'Calendar event created.' : 'Note: Calendar sync failed.'}`,
      })

      // Call success callback
      onTaskCreated()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "There was a problem creating the task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Task Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Create thumbnail design"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Add any additional details"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : "Select due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="assignedTo">Assign To</Label>
        <Select value={formData.assignedTo} onValueChange={(value) => handleSelectChange("assignedTo", value)}>
          <SelectTrigger id="assignedTo">
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!clientId && (
        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select value={formData.clientId} onValueChange={(value) => handleSelectChange("clientId", value)}>
            <SelectTrigger id="clientId">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </form>
  )
}
