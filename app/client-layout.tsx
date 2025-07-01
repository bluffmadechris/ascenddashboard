"use client"

import { useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationsProvider } from "@/lib/notifications-context"
import { DisplayTitleProvider } from "@/lib/display-title-context"
import { cleanupOldData } from "@/lib/data-persistence"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Clean up old data that has been migrated to the API
        cleanupOldData()
    }, [])

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
                <NotificationsProvider>
                    <DisplayTitleProvider>
                        {children}
                        <Toaster />
                    </DisplayTitleProvider>
                </NotificationsProvider>
            </AuthProvider>
        </ThemeProvider>
    )
} 