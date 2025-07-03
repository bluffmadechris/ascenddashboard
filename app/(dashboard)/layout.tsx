"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { UserNav } from "@/components/dashboard/user-nav"
import { NotificationsMenu } from "@/components/dashboard/notifications"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Meteors } from "@/components/ui/meteors"
import { EditModeProvider } from "@/components/edit-mode-context"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import {
  LayoutDashboard,
  Receipt,
  FolderKanban,
  Calendar as CalendarIcon,
  Users,
  Shield,
} from "lucide-react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dashboard">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-dashboard relative overflow-hidden">
      <Meteors number={15} />
      <SidebarProvider>
        <div className="flex flex-1 relative z-10">
          <Sidebar className="border-r" collapsible="offcanvas">
            <SidebarHeader>
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-sm">
                  AM
                </div>
                <span className="text-xl">ASCEND MEDIA</span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard" className={`sidebar-item ${pathname === "/dashboard" ? "active" : ""}`}>
                      <LayoutDashboard className="sidebar-item-icon" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/invoices" className={`sidebar-item ${pathname.startsWith("/invoices") ? "active" : ""}`}>
                      <Receipt className="sidebar-item-icon" />
                      <span>Invoices</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {(user?.role === "owner" || user?.role === "designer" || user?.role === "editor") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/clients" className={`sidebar-item ${pathname.startsWith("/clients") ? "active" : ""}`}>
                        <FolderKanban className="sidebar-item-icon" />
                        <span>Clients</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/calendar" className={`sidebar-item ${pathname.startsWith("/calendar") ? "active" : ""}`}>
                      <CalendarIcon className="sidebar-item-icon" />
                      <span>Calendar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/meeting-requests" className={`sidebar-item ${pathname.startsWith("/meeting-requests") ? "active" : ""}`}>
                      <CalendarIcon className="sidebar-item-icon" />
                      <span>Meeting Requests</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/team" className={`sidebar-item ${pathname.startsWith("/team") ? "active" : ""}`}>
                      <Users className="sidebar-item-icon" />
                      <span>Teams</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {(user?.role === "owner" || user?.role === "admin") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/owner-panel" className={`sidebar-item ${pathname.startsWith("/owner-panel") ? "active" : ""}`}>
                        <Shield className="sidebar-item-icon" />
                        <span>Owner Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card/80 backdrop-blur-sm px-6">
              <SidebarTrigger />
              <div className="flex flex-1 items-center justify-end gap-3">
                <ThemeToggle />
                <NotificationsMenu />
                <UserNav />
              </div>
            </header>
            <main className="flex-1 p-6">
              <EditModeProvider>{children}</EditModeProvider>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  )
}
