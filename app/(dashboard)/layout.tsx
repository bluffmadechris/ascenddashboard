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
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

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
      <div className="flex flex-1 relative z-10">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card/80 backdrop-blur-sm px-6">
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
      <Toaster />
    </div>
  )
}
