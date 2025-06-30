import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export function RecentProjects() {
  const projects = [
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
  ]

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col space-y-1.5 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{project.name}</div>
                <Badge
                  variant={
                    project.status === "Completed" ? "default" : project.status === "Review" ? "secondary" : "outline"
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Client:{" "}
                <Link href={`/clients/${project.clientId}`} className="hover:underline">
                  {project.client}
                </Link>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.assignee.avatar || "/placeholder.svg"} alt={project.assignee.name} />
                    <AvatarFallback>{project.assignee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{project.assignee.name}</span>
                </div>
                <div>Due: {project.dueDate}</div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="mt-1 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/tasks-projects">View All Projects</Link>
        </Button>
      </div>
    </div>
  )
}
