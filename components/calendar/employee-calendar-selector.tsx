"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useOrgHierarchy } from "@/lib/org-hierarchy-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { loadUserAvailability, getUserEvents } from "@/lib/calendar-utils"
import type { CalendarEvent } from "@/lib/calendar-utils"

interface EmployeeCalendarInfo {
    userId: string
    name: string
    role: string
    avatar?: string
    email: string
    visible: boolean
    hasAvailability: boolean
    eventCount: number
    color: string
}

interface EmployeeCalendarSelectorProps {
    selectedEmployees: string[]
    onEmployeeToggle: (userId: string) => void
    events: CalendarEvent[]
}

// Predefined colors for different employees
const EMPLOYEE_COLORS = [
    "#ef4444", // red
    "#f97316", // orange  
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#84cc16", // lime
    "#f59e0b", // amber
]

export function EmployeeCalendarSelector({
    selectedEmployees,
    onEmployeeToggle,
    events,
}: EmployeeCalendarSelectorProps) {
    const { user, users } = useAuth()
    const { orgData } = useOrgHierarchy()
    const [employeeInfo, setEmployeeInfo] = useState<EmployeeCalendarInfo[]>([])

    useEffect(() => {
        if (!users || !user) return

        // Only show this component to owners and managers
        if (user.role !== "owner" && !user.role.includes("manager")) return

        const employeeData: EmployeeCalendarInfo[] = []

        users.forEach((employee, index) => {
            // Skip the current user
            if (employee.id === user.id) return

            // Get availability info
            const availability = loadUserAvailability(employee.id)
            const hasAvailability = availability && availability.dates.length > 0

            // Get event count for this employee
            const userEvents = getUserEvents(employee.id)
            const eventCount = userEvents.length

            employeeData.push({
                userId: employee.id,
                name: employee.name,
                role: employee.role,
                avatar: employee.avatar,
                email: employee.email,
                visible: selectedEmployees.includes(employee.id),
                hasAvailability: !!hasAvailability,
                eventCount,
                color: EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length],
            })
        })

        // Sort by role hierarchy (owner first, then managers, then others)
        employeeData.sort((a, b) => {
            const roleOrder = { owner: 0, manager: 1, employee: 2 }
            const aOrder = a.role.includes("manager") ? 1 : (roleOrder[a.role as keyof typeof roleOrder] ?? 3)
            const bOrder = b.role.includes("manager") ? 1 : (roleOrder[b.role as keyof typeof roleOrder] ?? 3)

            if (aOrder !== bOrder) return aOrder - bOrder
            return a.name.localeCompare(b.name)
        })

        setEmployeeInfo(employeeData)
    }, [users, user, selectedEmployees, events])

    // Don't render for non-owners/managers
    if (!user || (user.role !== "owner" && !user.role.includes("manager"))) {
        return null
    }

    if (employeeInfo.length === 0) {
        return null
    }

    const handleSelectAll = () => {
        const allEmployeeIds = employeeInfo.map(emp => emp.userId)
        const allSelected = allEmployeeIds.every(id => selectedEmployees.includes(id))

        if (allSelected) {
            // Deselect all
            allEmployeeIds.forEach(id => onEmployeeToggle(id))
        } else {
            // Select all that aren't already selected
            allEmployeeIds.forEach(id => {
                if (!selectedEmployees.includes(id)) {
                    onEmployeeToggle(id)
                }
            })
        }
    }

    const selectedCount = selectedEmployees.length
    const totalCount = employeeInfo.length

    return (
        <Card className="bg-[#0f1729] text-white border-none">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Team Calendars
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white/10 text-white">
                        {selectedCount}/{totalCount}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs text-white/70 hover:text-white hover:bg-white/10 justify-start p-0 h-auto"
                >
                    {selectedCount === totalCount ? "Deselect All" : "Select All"}
                </Button>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-64 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-2 pr-3">
                            {employeeInfo.map((employee) => (
                                <div
                                    key={employee.userId}
                                    className={cn(
                                        "flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer",
                                        employee.visible && "bg-white/10"
                                    )}
                                    onClick={() => onEmployeeToggle(employee.userId)}
                                >
                                    <Checkbox
                                        checked={employee.visible}
                                        onChange={() => onEmployeeToggle(employee.userId)}
                                        className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                                    />

                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <div className="relative">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={employee.avatar} alt={employee.name} />
                                                <AvatarFallback className="text-xs bg-white/20">
                                                    {employee.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Color indicator */}
                                            <div
                                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#0f1729]"
                                                style={{ backgroundColor: employee.color }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-white truncate">
                                                    {employee.name}
                                                </span>
                                                {employee.visible && (
                                                    <Eye className="h-3 w-3 text-white/60" />
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 text-xs text-white/60">
                                                <span className="capitalize">{employee.role.replace("_", " ")}</span>
                                                {employee.eventCount > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {employee.eventCount}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    )
} 