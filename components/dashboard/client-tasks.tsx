"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { loadData, saveData } from "@/lib/data-persistence"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import type { Task } from "@/components/dashboard/create-task-form"

interface ClientTasksProps {
  clientId: string
}

export function ClientTasks({ clientId }: ClientTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const { users } = useAuth()

  useEffect(() => {
    const loadTasks = () => {
      try {
        const allTasks = loadData<Task[]>("tasks", [])
        const clientTasks = allTasks.filter(task => task.clientId === clientId)
        setTasks(clientTasks)
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    }

    loadTasks()

    // Listen for storage events
    const handleStorageChange = () => {
      loadTasks()
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [clientId])

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { 
          ...task, 
          status: task.status === "completed" ? "pending" : "completed",
          completedAt: task.status === "completed" ? undefined : new Date().toISOString()
        }
        return updatedTask
      }
      return task
    })

    // Update tasks in state and storage
    setTasks(updatedTasks)
    const allTasks = loadData<Task[]>("tasks", [])
    const newTasks = allTasks.map(task => {
      if (task.id === taskId) {
        return updatedTasks.find(t => t.id === taskId)!
      }
      return task
    })
    saveData("tasks", newTasks)

    // Trigger storage event
    window.dispatchEvent(new Event("storage"))
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const assignee = users.find(user => user.id === task.assignedTo)
            return (
              <TableRow key={task.id} className={task.status === "completed" ? "opacity-60" : ""}>
                <TableCell>
                  <Checkbox 
                    checked={task.status === "completed"} 
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {task.name}
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      task.priority === "high" ? "destructive" : 
                      task.priority === "medium" ? "secondary" : 
                      "outline"
                    }
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(task.dueDate), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignee?.avatar || "/placeholder.svg"} alt={assignee?.name} />
                      <AvatarFallback>{assignee?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{assignee?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={task.status === "completed" ? "outline" : "secondary"}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <DeleteButton 
                      itemName={task.name} 
                      itemType="task" 
                      onDelete={() => {
                        const allTasks = loadData<Task[]>("tasks", [])
                        const updatedTasks = allTasks.filter(t => t.id !== task.id)
                        saveData("tasks", updatedTasks)
                        setTasks(tasks.filter(t => t.id !== task.id))
                        window.dispatchEvent(new Event("storage"))
                      }} 
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
