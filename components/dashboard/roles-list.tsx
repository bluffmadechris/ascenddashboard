"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PlusCircle, Edit, Trash2, ShieldCheck, Shield } from "lucide-react"

interface RolesListProps {
  onCreateRole?: () => void
  onEditRole?: (roleId: string) => void
}

export function RolesList({ onCreateRole, onEditRole }: RolesListProps) {
  // Mock roles data - in a real app, this would come from your roles context
  const [roles] = useState([
    {
      id: "owner",
      name: "Owner",
      description: "Full access to all resources",
      isSystem: true,
      permissions: ["all"],
      color: "purple",
      memberCount: 1,
    },
    {
      id: "admin",
      name: "Manager",
      description: "Administrative access to the system",
      isSystem: true,
      permissions: ["manage_users", "manage_content", "view_reports"],
      color: "blue",
      memberCount: 2,
    },
    {
      id: "employee",
      name: "Creative",
      description: "Basic access to the platform",
      isSystem: true,
      permissions: ["view_dashboard", "view_calendar", "view_team", "view_availability"],
      color: "amber",
      memberCount: 5,
    },
  ])

  const handleCreateRole = () => {
    if (onCreateRole) {
      onCreateRole()
    }
  }

  const handleEditRole = (roleId: string) => {
    if (onEditRole) {
      onEditRole(roleId)
    }
  }

  const handleDeleteRole = (roleId: string) => {
    // In a real app, you would call a function to delete the role
    console.log(`Delete role: ${roleId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Roles</h2>
          <p className="text-sm text-muted-foreground">Manage roles and their permissions</p>
        </div>
        <Button onClick={handleCreateRole}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id} className={`border-l-4 ${getBorderColor(role.color)}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    {role.name}
                    {role.isSystem && (
                      <Badge variant="secondary" className="ml-2">
                        System
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditRole(role.id)} title="Edit role">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!role.isSystem && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Delete role">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the {role.name} role? This action cannot be undone.
                            {role.memberCount > 0 && (
                              <p className="mt-2 text-destructive">
                                Warning: {role.memberCount} team member{role.memberCount !== 1 ? "s" : ""} currently
                                have this role assigned.
                              </p>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="flex items-center mr-4">
                  {role.isSystem ? (
                    <ShieldCheck className="mr-1 h-4 w-4 text-primary" />
                  ) : (
                    <Shield className="mr-1 h-4 w-4" />
                  )}
                  {role.permissions.includes("all")
                    ? "All permissions"
                    : `${role.permissions.length} permission${role.permissions.length !== 1 ? "s" : ""}`}
                </div>
                <div>
                  {role.memberCount} member{role.memberCount !== 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={() => handleEditRole(role.id)}>
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

function getBorderColor(color: string): string {
  switch (color) {
    case "purple":
      return "border-purple-500"
    case "blue":
      return "border-blue-500"
    case "green":
      return "border-green-500"
    case "red":
      return "border-red-500"
    case "amber":
      return "border-amber-500"
    default:
      return "border-gray-500"
  }
}
