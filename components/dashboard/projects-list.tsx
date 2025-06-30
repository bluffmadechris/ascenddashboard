"use client"
import { useState, useEffect } from "react"
import { loadData, saveData } from "@/lib/data-persistence"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { DeleteButton } from "@/components/ui/delete-button"

export function ProjectsList() {
  const [projects, setProjects] = useState([
    {
      id: "1",
      name: "Website Redesign",
      client: "Acme Corp",
      clientId: "acme-corp",
      progress: 75,
      status: "In Progress",
      dueDate: "May 15, 2025",
      assignee: {
        name: "Alex Johnson",
        avatar: "/abstract-geometric-shapes.png",
      },
    },
    {
      id: "2",
      name: "Social Media Campaign",
      client: "TechStart",
      clientId: "tech-start",
      progress: 40,
      status: "In Progress",
      dueDate: "May 20, 2025",
      assignee: {
        name: "Sarah Miller",
        avatar: "/abstract-geometric-shapes.png",
      },
    },
    {
      id: "3",
      name: "Product Launch Video",
      client: "GlobalTech",
      clientId: "global-tech",
      progress: 90,
      status: "Review",
      dueDate: "May 10, 2025",
      assignee: {
        name: "Mike Wilson",
        avatar: "/diverse-group-collaborating.png",
      },
    },
    {
      id: "4",
      name: "Brand Guidelines",
      client: "Startup Inc",
      clientId: "startup-inc",
      progress: 100,
      status: "Completed",
      dueDate: "May 1, 2025",
      assignee: {
        name: "Emily Chen",
        avatar: "/abstract-geometric-shapes.png",
      },
    },
    {
      id: "5",
      name: "Marketing Strategy",
      client: "NewBiz LLC",
      clientId: "newbiz-llc",
      progress: 60,
      status: "In Progress",
      dueDate: "May 25, 2025",
      assignee: {
        name: "David Kim",
        avatar: "/abstract-geometric-shapes.png",
      },
    },
  ])

  // Load projects from local storage on component mount
  useEffect(() => {
    const savedProjects = loadData("projects", null)
    if (savedProjects) {
      setProjects(savedProjects)
    } else {
      // If no projects in storage, save the default projects
      saveData("projects", projects)
    }
  }, [])

  // Delete project
  const deleteProject = async (projectId: string) => {
    const updatedProjects = projects.filter((project) => project.id !== projectId)
    setProjects(updatedProjects)
    saveData("projects", updatedProjects)

    // Trigger storage event to update other components
    window.dispatchEvent(new Event("storage"))
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Link href={`/clients/${project.clientId}`} className="hover:underline">
                    {project.client}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      project.status === "Completed" ? "default" : project.status === "Review" ? "secondary" : "outline"
                    }
                  >
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2 w-[60px]" />
                    <span className="text-xs">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>{project.dueDate}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.assignee.avatar || "/placeholder.svg"} alt={project.assignee.name} />
                      <AvatarFallback>{project.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{project.assignee.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <DeleteButton
                      itemName={project.name}
                      itemType="project"
                      onDelete={() => deleteProject(project.id)}
                    />
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
