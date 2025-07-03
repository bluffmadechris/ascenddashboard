import { loadData } from "@/lib/data-persistence"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

interface Project {
  id: string
  name: string
  status: string
  progress: number
  dueDate: string
  assignee: {
    name: string
    avatar?: string
  }
}

interface ClientProjectsProps {
  clientId?: string
  limit?: number
}

export function ClientProjects({ clientId, limit }: ClientProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    // Load projects from storage
    const storedProjects = loadData<Project[]>(`projects-${clientId}`, [])
    setProjects(storedProjects)
  }, [clientId])

  // Apply limit if specified
  const displayedProjects = limit ? projects.slice(0, limit) : projects

  if (projects.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No projects found for this client.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assignee</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedProjects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.status}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{project.progress}%</span>
              </div>
            </TableCell>
            <TableCell>{new Date(project.dueDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={project.assignee.avatar} />
                  <AvatarFallback>
                    {project.assignee.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{project.assignee.name}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
