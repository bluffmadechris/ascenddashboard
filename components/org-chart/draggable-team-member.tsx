"use client"

import { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import type { TeamMemberNode } from "@/lib/org-hierarchy-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRoles } from "@/lib/roles-context"
import { cn } from "@/lib/utils"

interface DraggableTeamMemberProps {
  node: TeamMemberNode
  onDrop: (dragId: string, hoverId: string, newParentId: string | null) => void
  isRoot?: boolean
  canAcceptChildren?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
  isDragging?: boolean
}

export function DraggableTeamMember({
  node,
  onDrop,
  isRoot = false,
  canAcceptChildren = true,
  isExpanded = true,
  onToggleExpand,
  isDragging: externalIsDragging,
}: DraggableTeamMemberProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { getRole } = useRoles()
  const role = getRole(node.role)

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const [{ isDragging }, drag] = useDrag({
    type: "TEAM_MEMBER",
    item: { id: node.id, parentId: node.parentId },
    canDrag: !isRoot, // Root node cannot be dragged
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "TEAM_MEMBER",
    canDrop: (item: { id: string; parentId: string | null }) => {
      // Cannot drop on itself or its children (would create a cycle)
      if (item.id === node.id) return false

      // Check if the target is a descendant of the dragged item
      const isDescendant = (parentId: string | null): boolean => {
        if (parentId === item.id) return true
        if (parentId === null) return false
        const parent = document.querySelector(`[data-id="${parentId}"]`)
        if (!parent) return false
        const parentNodeId = parent.getAttribute("data-parent-id")
        return isDescendant(parentNodeId)
      }

      return canAcceptChildren && !isDescendant(node.id)
    },
    drop: (item: { id: string; parentId: string | null }) => {
      onDrop(item.id, node.id, canAcceptChildren ? node.id : node.parentId)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // Apply drag and drop refs
  drag(drop(ref))

  // Determine if this node is being dragged
  const actuallyDragging = isDragging || externalIsDragging

  // Determine border color based on drop state
  const getBorderColor = () => {
    if (isOver && canDrop) return "border-green-500"
    if (isOver && !canDrop) return "border-red-500"
    return "border-border/50"
  }

  return (
    <div
      ref={ref}
      data-id={node.id}
      data-parent-id={node.parentId}
      className={cn(
        "relative p-4 rounded-lg border transition-all duration-200",
        getBorderColor(),
        actuallyDragging ? "opacity-50" : "opacity-100",
        isRoot ? "bg-gradient-to-r from-purple-500/20 to-purple-400/10" : "bg-card/80 backdrop-blur-sm",
        isOver && canDrop ? "shadow-lg scale-105" : "",
        isOver && !canDrop ? "bg-red-100/10" : "",
      )}
      style={{
        cursor: isRoot ? "default" : "move",
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar className={cn("h-10 w-10 border-2", isRoot ? "border-purple-300" : "border-border/50")}>
          {node.avatar ? (
            <AvatarImage src={node.avatar || "/placeholder.svg"} alt={node.name} className="object-cover" />
          ) : (
            <AvatarFallback className={cn("text-sm", isRoot ? "bg-purple-200 text-purple-800" : "bg-primary/20")}>
              {getInitials(node.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h4 className="font-medium text-sm">{node.name}</h4>
          <p className="text-xs text-muted-foreground">
            {role?.name || node.role}
            {node.children.length > 0 &&
              ` · ${node.children.length} direct ${node.children.length === 1 ? "report" : "reports"}`}
          </p>
        </div>
        {node.children.length > 0 && onToggleExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="ml-auto text-xs bg-muted/50 hover:bg-muted px-2 py-1 rounded"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  )
}
