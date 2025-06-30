import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { MoreHorizontal, Eye } from "lucide-react"

export function OnboardingList() {
  const onboardings = [
    {
      id: "ONB-001",
      name: "Client Onboarding",
      entity: "Acme Corp",
      entityId: "acme-corp",
      type: "Client",
      progress: 100,
      status: "Completed",
      startDate: "Apr 15, 2025",
      endDate: "Apr 20, 2025",
    },
    {
      id: "ONB-002",
      name: "Employee Onboarding",
      entity: "Sarah Miller",
      entityId: "sarah-miller",
      type: "Employee",
      progress: 75,
      status: "In Progress",
      startDate: "May 1, 2025",
      endDate: "May 10, 2025",
    },
    {
      id: "ONB-003",
      name: "Client Onboarding",
      entity: "TechStart",
      entityId: "tech-start",
      type: "Client",
      progress: 50,
      status: "In Progress",
      startDate: "May 3, 2025",
      endDate: "May 15, 2025",
    },
    {
      id: "ONB-004",
      name: "Employee Onboarding",
      entity: "Mike Wilson",
      entityId: "mike-wilson",
      type: "Employee",
      progress: 25,
      status: "In Progress",
      startDate: "May 5, 2025",
      endDate: "May 15, 2025",
    },
    {
      id: "ONB-005",
      name: "Client Onboarding",
      entity: "GlobalTech",
      entityId: "global-tech",
      type: "Client",
      progress: 0,
      status: "Not Started",
      startDate: "May 10, 2025",
      endDate: "May 20, 2025",
    },
  ]

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {onboardings.map((onboarding) => (
              <TableRow key={onboarding.id}>
                <TableCell className="font-medium">{onboarding.id}</TableCell>
                <TableCell>{onboarding.name}</TableCell>
                <TableCell>
                  {onboarding.type === "Client" ? (
                    <Link href={`/clients/${onboarding.entityId}`} className="hover:underline">
                      {onboarding.entity}
                    </Link>
                  ) : (
                    onboarding.entity
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={onboarding.type === "Client" ? "default" : "secondary"}>{onboarding.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={onboarding.progress} className="h-2 w-[60px]" />
                    <span className="text-xs">{onboarding.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      onboarding.status === "Completed"
                        ? "default"
                        : onboarding.status === "In Progress"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {onboarding.status}
                  </Badge>
                </TableCell>
                <TableCell>{onboarding.startDate}</TableCell>
                <TableCell>{onboarding.endDate}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
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
