"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string
  role: string
  avatarUrl?: string
  managerId?: string
}

interface OrgChartProps {
  onMemberClick?: (member: TeamMember) => void
}

export function OrgChart({ onMemberClick }: OrgChartProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await api.get("/users/team-members")
        setTeamMembers(response.data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to fetch team members")
        setIsLoading(false)
      }
    }
    fetchTeamMembers()
  }, [])

  const buildHierarchy = (members: TeamMember[]) => {
    const hierarchy: { [key: string]: TeamMember[] } = {}
    const roots: TeamMember[] = []

    // Group members by their manager
    members.forEach(member => {
      if (!member.managerId) {
        roots.push(member)
      } else {
        if (!hierarchy[member.managerId]) {
          hierarchy[member.managerId] = []
        }
        hierarchy[member.managerId].push(member)
      }
    })

    return { roots, hierarchy }
  }

  const renderTeamMember = (member: TeamMember, level: number = 0) => {
    const { hierarchy } = buildHierarchy(teamMembers)
    const reports = hierarchy[member.id] || []

    return (
      <div key={member.id} style={{ marginLeft: `${level * 40}px` }}>
        <div
          className="flex items-center p-4 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50"
          onClick={() => onMemberClick?.(member)}
        >
          {member.avatarUrl && (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-10 h-10 rounded-full mr-4"
            />
          )}
          <div>
            <h3 className="font-medium">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.role}</p>
          </div>
        </div>
        {reports.map(report => renderTeamMember(report, level + 1))}
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  const { roots } = buildHierarchy(teamMembers)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roots.map(root => renderTeamMember(root))}
        </div>
      </CardContent>
    </Card>
  )
}
