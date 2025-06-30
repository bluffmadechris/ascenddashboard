"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { loadData, saveData } from "@/lib/data-persistence"
import { useAuth } from "@/lib/auth-context"
import type { TeamMemberNode, OrgChartData } from "./org-hierarchy-types"
import { useRoles } from "./roles-context"
import { toast } from "@/components/ui/use-toast"

interface OrgHierarchyContextType {
  orgData: OrgChartData
  isLoading: boolean
  updateHierarchy: (nodes: TeamMemberNode[]) => void
  moveTeamMember: (dragId: string, hoverId: string, newParentId: string | null) => void
  getTeamMemberLevel: (userId: string) => number
  getTeamMemberParent: (userId: string) => string | null
  getTeamMemberChildren: (userId: string) => TeamMemberNode[]
  getTeamMemberReportingChain: (userId: string) => string[]
  initializeFromUsers: () => void
}

const OrgHierarchyContext = createContext<OrgHierarchyContextType | undefined>(undefined)

export function OrgHierarchyProvider({ children }: { children: React.ReactNode }) {
  const [orgData, setOrgData] = useState<OrgChartData>({ nodes: [] })
  const [isLoading, setIsLoading] = useState(true)
  const { users } = useAuth()
  const { roles } = useRoles()

  // Initialize or load saved hierarchy data
  useEffect(() => {
    const savedData = loadData("orgHierarchy", null)

    if (savedData) {
      setOrgData(savedData)
    } else {
      // If no saved data, initialize from users
      initializeFromUsers()
    }

    setIsLoading(false)
  }, [])

  // Save hierarchy data when it changes
  useEffect(() => {
    if (!isLoading && orgData.nodes.length > 0) {
      saveData("orgHierarchy", orgData)
    }
  }, [orgData, isLoading])

  // Initialize hierarchy from users
  const initializeFromUsers = () => {
    if (!users || users.length === 0) return

    // Find the owner
    const owner = users.find((user) => user.role === "owner")
    if (!owner) return

    // Create nodes for all users
    const nodes: TeamMemberNode[] = []

    // Add owner as root
    nodes.push({
      id: owner.id,
      name: owner.name,
      role: owner.role,
      avatar: owner.avatar,
      email: owner.email,
      level: 0,
      parentId: null,
      children: [],
    })

    // Add other users with default hierarchy
    // Designers and editors report to owner
    // Others report to their respective department heads
    users.forEach((user) => {
      if (user.id === owner.id) return // Skip owner as we already added them

      let parentId: string | null = owner.id // Default parent is owner
      let level = 1

      // Assign department heads
      if (user.role === "designer" || user.role === "editor" || user.role === "youtube_manager") {
        parentId = owner.id
        level = 1
      } else {
        // Find appropriate department head
        if (user.role.includes("design")) {
          const designer = users.find((u) => u.role === "designer")
          if (designer) {
            parentId = designer.id
            level = 2
          }
        } else if (user.role.includes("edit")) {
          const editor = users.find((u) => u.role === "editor")
          if (editor) {
            parentId = editor.id
            level = 2
          }
        } else if (user.role.includes("youtube")) {
          const youtubeManager = users.find((u) => u.role === "youtube_manager")
          if (youtubeManager) {
            parentId = youtubeManager.id
            level = 2
          }
        }
      }

      nodes.push({
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        email: user.email,
        level,
        parentId,
        children: [],
      })
    })

    // Build the hierarchy tree
    buildHierarchyTree(nodes)

    setOrgData({ nodes })
    saveData("orgHierarchy", { nodes })
  }

  // Build hierarchy tree by populating children arrays
  const buildHierarchyTree = (nodes: TeamMemberNode[]) => {
    // Clear all children arrays
    nodes.forEach((node) => {
      node.children = []
    })

    // Populate children arrays
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId)
        if (parent) {
          parent.children.push(node)
        }
      }
    })
  }

  // Update the entire hierarchy
  const updateHierarchy = (nodes: TeamMemberNode[]) => {
    buildHierarchyTree(nodes)
    setOrgData({ nodes })
  }

  // Move a team member in the hierarchy
  const moveTeamMember = (dragId: string, hoverId: string, newParentId: string | null) => {
    const newNodes = [...orgData.nodes]

    // Find the dragged node
    const draggedNode = newNodes.find((node) => node.id === dragId)
    if (!draggedNode) return

    // Update the parent ID
    draggedNode.parentId = newParentId

    // Update levels for the dragged node and its children
    updateNodeLevels(newNodes, draggedNode)

    // Rebuild the hierarchy tree
    buildHierarchyTree(newNodes)

    setOrgData({ nodes: newNodes })
    toast({
      title: "Team hierarchy updated",
      description: `${draggedNode.name} has been moved in the organization chart.`,
    })
  }

  // Update levels for a node and all its children recursively
  const updateNodeLevels = (nodes: TeamMemberNode[], node: TeamMemberNode) => {
    if (node.parentId === null) {
      node.level = 0
    } else {
      const parent = nodes.find((n) => n.id === node.parentId)
      if (parent) {
        node.level = parent.level + 1
      }
    }

    // Update children levels
    const children = nodes.filter((n) => n.parentId === node.id)
    children.forEach((child) => {
      updateNodeLevels(nodes, child)
    })
  }

  // Get a team member's level in the hierarchy
  const getTeamMemberLevel = (userId: string) => {
    const node = orgData.nodes.find((node) => node.id === userId)
    return node ? node.level : -1
  }

  // Get a team member's parent
  const getTeamMemberParent = (userId: string) => {
    const node = orgData.nodes.find((node) => node.id === userId)
    return node ? node.parentId : null
  }

  // Get a team member's children
  const getTeamMemberChildren = (userId: string) => {
    const node = orgData.nodes.find((node) => node.id === userId)
    return node ? node.children : []
  }

  // Get a team member's reporting chain (path to root)
  const getTeamMemberReportingChain = (userId: string) => {
    const chain: string[] = []
    let currentId = userId

    while (currentId) {
      chain.push(currentId)
      const node = orgData.nodes.find((node) => node.id === currentId)
      if (!node || node.parentId === null) break
      currentId = node.parentId
    }

    return chain
  }

  const contextValue = React.useMemo(
    () => ({
      orgData,
      isLoading,
      updateHierarchy,
      moveTeamMember,
      getTeamMemberLevel,
      getTeamMemberParent,
      getTeamMemberChildren,
      getTeamMemberReportingChain,
      initializeFromUsers,
    }),
    [orgData, isLoading, users],
  )

  return <OrgHierarchyContext.Provider value={contextValue}>{children}</OrgHierarchyContext.Provider>
}

export function useOrgHierarchy() {
  const context = useContext(OrgHierarchyContext)
  if (context === undefined) {
    throw new Error("useOrgHierarchy must be used within an OrgHierarchyProvider")
  }
  return context
}
