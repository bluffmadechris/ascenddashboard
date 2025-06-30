import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { MoreHorizontal } from "lucide-react"

export function ClientProjects({ limit }: { limit?: number }) {
  const projects = [
    {
      id: "1",
      name: "Website Redesign",
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
      progress: 60,
      status: "In Progress",
      dueDate: "May 25, 2025",
      assignee: {
        name: "David Kim",
        avatar: "/abstract-geometric-shapes.png",
      },
    },
  ]

  const displayProjects = limit ? projects.slice(0, limit) : projects

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
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
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
