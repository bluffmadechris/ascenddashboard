"use client"

import { useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { NotificationsProvider } from "@/lib/api-notifications-context"
import { DisplayTitleProvider } from "@/lib/display-title-context"
import { RolesProvider } from "@/lib/roles-context"
import { OrgHierarchyProvider } from "@/lib/org-hierarchy-context"
import { cleanupOldData } from "@/lib/data-persistence"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Clean up old data that has been migrated to the API
        cleanupOldData()
    }, [])

    function AuthenticatedShell({ children }: { children: React.ReactNode }) {
        const { user } = useAuth()

        // If not logged in, render the page content (public/auth pages)
        if (!user) {
            return <>{children}</>
        }

        // Logged-in user – rely on per-route layouts (e.g., /dashboard layout) for chrome
        return <>{children}</>
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RolesProvider>
                <DisplayTitleProvider>
                    <AuthProvider>
                        <OrgHierarchyProvider>
                            <NotificationsProvider>
                                <AuthenticatedShell>{children}</AuthenticatedShell>
                                <Toaster />
                            </NotificationsProvider>
                        </OrgHierarchyProvider>
                    </AuthProvider>
                </DisplayTitleProvider>
            </RolesProvider>
        </ThemeProvider>
    )
} 