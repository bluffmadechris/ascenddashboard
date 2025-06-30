"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Users,
  FileSignature,
  Receipt,
  Calendar,
  Shield,
  Pencil,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileEditDialog } from "@/components/dashboard/profile-edit-dialog"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }

    if (path !== "/dashboard" && pathname.startsWith(path)) {
      return true
    }

    return false
  }

  return (
    <>
      <div className="hidden border-r border-border/50 bg-card/50 backdrop-blur-sm md:block md:w-64">
        <div className="flex h-full flex-col">
          <div className="border-b border-border/50 px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
              <span className="text-xl">ASCEND MEDIA</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium">
              <Link href="/dashboard" className={`sidebar-item ${isActive("/dashboard") ? "active" : ""}`}>
                <LayoutDashboard className="sidebar-item-icon" />
                Dashboard
              </Link>
              {/* Only show contracts to owners and specific roles */}
              {(user?.role === "owner" || user?.role === "editor") && (
                <Link href="/contracts" className={`sidebar-item ${isActive("/contracts") ? "active" : ""}`}>
                  <FileSignature className="sidebar-item-icon" />
                  Contracts
                </Link>
              )}

              <Link href="/invoices" className={`sidebar-item ${isActive("/invoices") ? "active" : ""}`}>
                <Receipt className="sidebar-item-icon" />
                Invoices
              </Link>

              {/* Only show all clients to owners and specific roles */}
              {user?.role === "owner" || user?.role === "designer" || user?.role === "editor" ? (
                <Link href="/clients" className={`sidebar-item ${isActive("/clients") ? "active" : ""}`}>
                  <FolderKanban className="sidebar-item-icon" />
                  Clients
                </Link>
              ) : (
                // For restricted users, directly link to their allowed client
                user?.clientAccess?.map(
                  (access) =>
                    access.canView && (
                      <Link
                        key={access.clientId}
                        href={`/clients/${access.clientId}`}
                        className={`sidebar-item ${isActive(`/clients/${access.clientId}`) ? "active" : ""}`}
                      >
                        <FolderKanban className="sidebar-item-icon" />
                        {access.clientId === "capri"
                          ? "Capri"
                          : access.clientId === "piper-rockelle"
                            ? "Piper Rockelle"
                            : access.clientId === "paryeet"
                              ? "Paryeet"
                              : access.clientId === "lacy-vods"
                                ? "Lacy VODS"
                                : "Client"}
                      </Link>
                    ),
                )
              )}

              {/* Calendar link for all users */}
              <Link href="/calendar" className={`sidebar-item ${isActive("/calendar") ? "active" : ""}`}>
                <Calendar className="sidebar-item-icon" />
                Calendar
              </Link>

              {/* Availability link for all users */}
              <Link href="/availability" className={`sidebar-item ${isActive("/availability") ? "active" : ""}`}>
                <ListChecks className="sidebar-item-icon" />
                Availability
              </Link>

              {/* Meeting requests link for all users */}
              <Link href="/meeting-requests" className={`sidebar-item ${isActive("/meeting-requests") ? "active" : ""}`}>
                <Calendar className="sidebar-item-icon" />
                Meeting Requests
              </Link>

              {/* Team page link */}
              <Link href="/team" className={`sidebar-item ${isActive("/team") ? "active" : ""}`}>
                <Users className="sidebar-item-icon" />
                Teams
              </Link>

              {/* Only show owner panel to owners and admins */}
              {(user?.role === "owner" || user?.role === "admin") && (
                <Link href="/owner-panel" className={`sidebar-item ${isActive("/owner-panel") ? "active" : ""}`}>
                  <Shield className="sidebar-item-icon" />
                  Owner Panel
                </Link>
              )}
            </nav>
          </div>
          <div className="mt-auto border-t border-border/50 p-4">
            <Button
              variant="ghost"
              className="w-full p-0 h-auto hover:bg-transparent"
              onClick={() => setIsProfileDialogOpen(true)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-1 -bottom-1 bg-card rounded-full p-0.5 border border-border">
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium">{user?.name || "User"}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.role === "owner" ? "Owner" : user?.role || "Team Member"}
                  </span>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Edit Dialog */}
      <ProfileEditDialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </>
  )
}
