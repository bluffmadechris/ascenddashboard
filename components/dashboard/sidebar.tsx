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
  ChevronRight,
  Bell,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileEditDialog } from "@/components/dashboard/profile-edit-dialog"
import { cn } from "@/lib/utils"

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

  const NavItem = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex items-center gap-x-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
          active
            ? "bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/50"
            : "text-muted-foreground hover:bg-accent/30 hover:text-accent-foreground hover:shadow-sm"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-all duration-300",
            active
              ? "text-primary-foreground"
              : "text-muted-foreground group-hover:text-accent-foreground"
          )}
        />
        <span className="truncate">{children}</span>
        {active && (
          <ChevronRight
            className="ml-auto h-4 w-4 text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300"
          />
        )}
      </Link>
    )
  }

  return (
    <>
      <div className="hidden border-r bg-gradient-to-b from-background to-card/95 backdrop-blur-xl md:block md:w-72 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b px-8 py-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Ascend Media" className="h-8 w-auto" />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-xl font-bold text-transparent">
                ASCEND MEDIA
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-2 overflow-auto px-4 py-6">
            <div className="space-y-2">
              <NavItem href="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
              <NavItem href="/invoices" icon={Receipt}>Invoices</NavItem>

              {/* Clients section */}
              {user?.role === "owner" || user?.role === "designer" || user?.role === "editor" ? (
                <NavItem href="/clients" icon={FolderKanban}>Clients</NavItem>
              ) : (
                user?.clientAccess?.map(
                  (access) =>
                    access.canView && (
                      <NavItem
                        key={access.clientId}
                        href={`/clients/${access.clientId}`}
                        icon={FolderKanban}
                      >
                        {access.clientId === "capri"
                          ? "Capri"
                          : access.clientId === "piper-rockelle"
                            ? "Piper Rockelle"
                            : access.clientId === "paryeet"
                              ? "Paryeet"
                              : access.clientId === "lacy-vods"
                                ? "Lacy VODS"
                                : "Client"}
                      </NavItem>
                    )
                )
              )}

              <NavItem href="/calendar" icon={Calendar}>Calendar</NavItem>
              <NavItem href="/meeting-requests" icon={Bell}>Meeting Requests</NavItem>
              <NavItem href="/team" icon={Users}>Teams</NavItem>
              {(user?.role === "owner" || user?.role === "admin") && (
                <NavItem href="/owner-panel" icon={Shield}>Owner Panel</NavItem>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="group w-full rounded-xl p-3 h-auto hover:bg-accent/30 hover:shadow-sm transition-all duration-300"
              onClick={() => setIsProfileDialogOpen(true)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-border ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/50">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5 bg-card rounded-full p-1 border border-border shadow-sm">
                    <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium truncate">{user?.name || "User"}</span>
                  <span className="text-xs text-muted-foreground capitalize">
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
