export interface TeamMemberNode {
  id: string
  name: string
  role: string
  avatar?: string
  email: string
  level: number
  parentId: string | null
  children: TeamMemberNode[]
}

export interface OrgChartData {
  nodes: TeamMemberNode[]
}
