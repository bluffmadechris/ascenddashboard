"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useEffect, useState } from "react"
import { loadData, saveData } from "@/lib/data-persistence"
import { DeleteButton } from "@/components/ui/delete-button"

export function TasksList() {
  const [tasks, setTasks] = useState([
    {
      id: "1",
      name: "Design Homepage Mockup",
      project: "Website Redesign",
      projectId: "1",
      client: "Acme Corp",
      clientId: "acme-corp",
      priority: "High",
      dueDate: "2025-05-10T14:00:00.000Z",
      assignee: {
        name: "Alex Johnson",
        avatar: "/abstract-geometric-shapes.png",
      },
      completed: false,
    },
    {
      id: "2",
      name: "Create Social Media Content Calendar",
      project: "Social Media Campaign",
      projectId: "2",
      client: "TechStart",
      clientId: "tech-start",
      priority: "Medium",
      dueDate: "2025-05-12T10:00:00.000Z",
      assignee: {
        name: "Sarah Miller",
        avatar: "/abstract-geometric-shapes.png",
      },
      completed: false,
    },
    {
      id: "3",
      name: "Edit Product Demo Video",
      project: "Product Launch Video",
      projectId: "3",
      client: "GlobalTech",
      clientId: "global-tech",
      priority: "High",
      dueDate: "2025-05-08T16:30:00.000Z",
      assignee: {
        name: "Mike Wilson",
        avatar: "/diverse-group-collaborating.png",
      },
      completed: true,
    },
    {
      id: "4",
      name: "Finalize Logo Design",
      project: "Brand Guidelines",
      projectId: "4",
      client: "Startup Inc",
      clientId: "startup-inc",
      priority: "Low",
      dueDate: "2025-05-05T11:00:00.000Z",
      assignee: {
        name: "Emily Chen",
        avatar: "/abstract-geometric-shapes.png",
      },
      completed: true,
    },
    {
      id: "5",
      name: "Competitor Analysis Research",
      project: "Marketing Strategy",
      projectId: "5",
      client: "NewBiz LLC",
      clientId: "newbiz-llc",
      priority: "Medium",
      dueDate: "2025-05-15T15:00:00.000Z",
      assignee: {
        name: "David Kim",
        avatar: "/abstract-geometric-shapes.png",
      },
      completed: false,
    },
  ])

  // Load tasks from local storage on component mount
  useEffect(() => {
    const savedTasks = loadData("tasks", null)
    if (savedTasks) {
      setTasks(savedTasks)
    } else {
      // If no tasks in storage, save the default tasks
      saveData("tasks", tasks)
    }
  }, [])

  // Update task completion status
  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed }
      }
      return task
    })

    setTasks(updatedTasks)
    saveData("tasks", updatedTasks)

    // Trigger storage event to update other components
    window.dispatchEvent(new Event("storage"))
  }

  // Delete task
  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
    saveData("tasks", updatedTasks)

    // Trigger storage event to update other components
    window.dispatchEvent(new Event("storage"))
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className={task.completed ? "opacity-60" : ""}>
                <TableCell>
                  <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task.id)} />
                </TableCell>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.project}</TableCell>
                <TableCell>
                  <Link href={`/clients/${task.clientId}`} className="hover:underline">
                    {task.client}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"
                    }
                  >
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(task.dueDate)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} alt={task.assignee.name} />
                      <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{task.assignee.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <DeleteButton itemName={task.name} itemType="task" onDelete={() => deleteTask(task.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
