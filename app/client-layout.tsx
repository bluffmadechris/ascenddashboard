"use client"

import { useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationsProvider } from "@/lib/api-notifications-context"
import { DisplayTitleProvider } from "@/lib/display-title-context"
import { RolesProvider } from "@/lib/roles-context"
import { OrgHierarchyProvider } from "@/lib/org-hierarchy-context"
import { cleanupOldData } from "@/lib/data-persistence"
import { Sidebar } from "@/components/ui/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Clean up old data that has been migrated to the API
        cleanupOldData()
    }, [])

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RolesProvider>
                <DisplayTitleProvider>
                    <AuthProvider>
                        <OrgHierarchyProvider>
                            <NotificationsProvider>
                                <div className="min-h-screen flex flex-col md:flex-row">
                                    <Sidebar className="w-full md:w-64 shrink-0 border-r" />
                                    <div className="flex-1 flex flex-col min-h-screen">
                                        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-8">
                                            <div className="flex-1" />
                                            <UserNav />
                                        </header>
                                        <main className="flex-1 p-4 lg:p-8 overflow-auto">
                                            <div className="mx-auto max-w-6xl">
                                                {children}
                                            </div>
                                        </main>
                                    </div>
                                </div>
                                <Toaster />
                            </NotificationsProvider>
                        </OrgHierarchyProvider>
                    </AuthProvider>
                </DisplayTitleProvider>
            </RolesProvider>
        </ThemeProvider>
    )
} 