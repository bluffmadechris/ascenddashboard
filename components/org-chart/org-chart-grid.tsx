"use client"

import { useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { TeamMemberNode } from "@/lib/org-hierarchy-types"
import { DraggableTeamMember } from "./draggable-team-member"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Users } from "lucide-react"

interface OrgChartGridProps {
  nodes: TeamMemberNode[]
  onMoveNode: (dragId: string, hoverId: string, newParentId: string | null) => void
}

export function OrgChartGrid({ nodes, onMoveNode }: OrgChartGridProps) {
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    0: true, // Root level is expanded by default
    1: true, // First level is expanded by default
  })

  // Group nodes by level
  const nodesByLevel = nodes.reduce(
    (acc, node) => {
      if (!acc[node.level]) {
        acc[node.level] = []
      }
      acc[node.level].push(node)
      return acc
    },
    {} as Record<number, TeamMemberNode[]>,
  )

  // Sort levels
  const sortedLevels = Object.keys(nodesByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  // Toggle level expansion
  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }))
  }

  // Check if a level is expanded
  const isLevelExpanded = (level: number) => {
    return expandedLevels[level] !== false
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-8">
        {sortedLevels.map((level) => {
          const levelNodes = nodesByLevel[level]
          const isExpanded = isLevelExpanded(level)

          return (
            <div key={level} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">
                    {level === 0
                      ? "Leadership"
                      : level === 1
                        ? "Department Heads"
                        : level === 2
                          ? "Team Leads"
                          : `Level ${level + 1}`}
                  </h3>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{levelNodes.length}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleLevel(level)} className="h-8 w-8 p-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {isExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levelNodes.map((node) => {
                    // Find parent node
                    const parentNode = node.parentId ? nodes.find((n) => n.id === node.parentId) : null

                    return (
                      <div key={node.id} className="relative">
                        <DraggableTeamMember node={node} onDrop={onMoveNode} isRoot={level === 0} />
                        {parentNode && (
                          <div className="text-xs text-muted-foreground mt-1 ml-2">Reports to: {parentNode.name}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </DndProvider>
  )
}
