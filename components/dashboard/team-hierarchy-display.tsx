"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Building, Palette } from "lucide-react"
import { getInitials } from "@/lib/utils"

interface TeamMember {
    id: string
    name: string
    role: string
    avatar?: string
    email: string
    bio?: string
}

interface TeamHierarchyDisplayProps {
    users: TeamMember[]
    onMemberClick?: (user: TeamMember) => void
}

export function TeamHierarchyDisplay({ users, onMemberClick }: TeamHierarchyDisplayProps) {
    // Get user category for styling
    const getUserCategory = (userRole: string): string => {
        if (userRole === "owner" || userRole === "president" || userRole === "ceo") {
            return "owner"
        }
        if (
            userRole === "manager" ||
            userRole === "youtube_manager" ||
            userRole.includes("manager") ||
            userRole.includes("director") ||
            userRole.includes("lead")
        ) {
            return "management"
        }
        return "creative"
    }

    // Organize users by hierarchy
    const owners = users.filter(user => getUserCategory(user.role) === "owner")
        .sort((a, b) => a.name.localeCompare(b.name))

    const management = users.filter(user => getUserCategory(user.role) === "management")
        .sort((a, b) => a.name.localeCompare(b.name))

    const creative = users.filter(user => getUserCategory(user.role) === "creative")
        .sort((a, b) => a.name.localeCompare(b.name))

    // Format role name for display
    const formatRoleName = (role: string) => {
        return role
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    }

    // Get category styling
    const getCategoryInfo = (category: string) => {
        switch (category) {
            case "owner":
                return {
                    color: "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800",
                    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                    icon: <Crown className="h-4 w-4 text-purple-600" />
                }
            case "management":
                return {
                    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
                    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    icon: <Building className="h-4 w-4 text-blue-600" />
                }
            case "creative":
                return {
                    color: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
                    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                    icon: <Palette className="h-4 w-4 text-amber-600" />
                }
            default:
                return {
                    color: "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800",
                    badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                    icon: null
                }
        }
    }

    const renderMemberCard = (user: TeamMember) => {
        const category = getUserCategory(user.role)
        const categoryInfo = getCategoryInfo(category)

        return (
            <Card
                key={user.id}
                className={`transition-all hover:shadow-md cursor-pointer ${categoryInfo.color}`}
                onClick={() => onMemberClick?.(user)}
            >
                <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center space-y-3">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="text-sm font-medium">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                            <h3 className="font-semibold text-sm">{user.name}</h3>
                            <Badge variant="secondary" className={categoryInfo.badgeColor}>
                                <div className="flex items-center gap-1">
                                    {categoryInfo.icon}
                                    {formatRoleName(user.role)}
                                </div>
                            </Badge>
                        </div>

                        {user.bio && (
                            <p className="text-xs text-muted-foreground max-w-full overflow-hidden"
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.2em',
                                    maxHeight: '2.4em'
                                }}>
                                {user.bio}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderHierarchyLevel = (title: string, members: TeamMember[], level: number) => {
        if (members.length === 0) return null

        const levelIndent = level * 20

        return (
            <div className="space-y-4" style={{ marginLeft: `${levelIndent}px` }}>
                <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider">
                    {title} ({members.length})
                </h3>

                {/* Connection lines for visual hierarchy */}
                {level > 0 && (
                    <div className="relative">
                        <div className="absolute -left-4 top-0 w-4 h-full border-l-2 border-dashed border-muted-foreground/30" />
                        <div className="absolute -left-4 top-6 w-4 h-0 border-t-2 border-dashed border-muted-foreground/30" />
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {members.map(renderMemberCard)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Organization Hierarchy</h2>
                <p className="text-muted-foreground">
                    Visual representation of our team structure and reporting relationships
                </p>
            </div>

            <div className="space-y-12">
                {renderHierarchyLevel("Leadership Team", owners, 0)}
                {renderHierarchyLevel("Management Team", management, 1)}
                {renderHierarchyLevel("Creative Team", creative, 2)}
            </div>

            {users.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No team members found</p>
                </div>
            )}
        </div>
    )
} 