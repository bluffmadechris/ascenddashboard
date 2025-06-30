"use client"

import { useState, useCallback } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { TeamMemberNode } from "@/lib/org-hierarchy-types"
import { DraggableTeamMember } from "./draggable-team-member"
import { cn } from "@/lib/utils"

interface OrgChartProps {
  nodes: TeamMemberNode[]
  onMoveNode: (dragId: string, hoverId: string, newParentId: string | null) => void
}

export function OrgChart({ nodes, onMoveNode }: OrgChartProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }, [])

  // Check if a node is expanded
  const isNodeExpanded = useCallback(
    (nodeId: string) => {
      return expandedNodes[nodeId] !== false // Default to expanded
    },
    [expandedNodes],
  )

  // Render a node and its children
  const renderNode = useCallback(
    (node: TeamMemberNode, level = 0, isLastChild = false) => {
      const hasChildren = node.children.length > 0
      const expanded = isNodeExpanded(node.id)

      return (
        <div key={node.id} className="relative">
          <div className="flex items-start">
            {/* Vertical line from parent */}
            {level > 0 && (
              <div
                className={cn(
                  "absolute border-l-2 border-dashed",
                  isLastChild ? "border-border/30 h-8" : "border-border/30 h-full",
                )}
                style={{ left: `${(level - 1) * 24 + 12}px`, top: "-16px" }}
              />
            )}

            {/* Horizontal line to node */}
            {level > 0 && (
              <div
                className="absolute border-t-2 border-dashed border-border/30"
                style={{ left: `${(level - 1) * 24 + 12}px`, width: "24px", top: "24px" }}
              />
            )}

            {/* Indentation based on level */}
            <div style={{ width: `${level * 48}px` }} className="flex-shrink-0" />

            {/* The node itself */}
            <div className="flex-1 mb-4">
              <DraggableTeamMember
                node={node}
                onDrop={onMoveNode}
                isRoot={level === 0}
                isExpanded={expanded}
                onToggleExpand={hasChildren ? () => toggleNodeExpansion(node.id) : undefined}
              />
            </div>
          </div>

          {/* Children */}
          {hasChildren && expanded && (
            <div className="ml-6">
              {node.children.map((child, index) => renderNode(child, level + 1, index === node.children.length - 1))}
            </div>
          )}
        </div>
      )
    },
    [isNodeExpanded, onMoveNode, toggleNodeExpansion],
  )

  // Find the root node (no parent)
  const rootNode = nodes.find((node) => node.parentId === null)

  if (!rootNode) {
    return <div className="text-center p-8">No organization hierarchy found.</div>
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="org-chart p-4 overflow-x-auto">{renderNode(rootNode)}</div>
    </DndProvider>
  )
}
