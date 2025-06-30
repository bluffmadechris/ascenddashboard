"use client"

import type React from "react"

import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/lib/auth-context"
import { OrgHierarchyProvider } from "@/lib/org-hierarchy-context"
import { RolesProvider } from "@/lib/roles-context"
import { NotificationsProvider } from "@/lib/api-notifications-context"
import { DisplayTitleProvider } from "@/lib/display-title-context"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RolesProvider>
        <DisplayTitleProvider>
          <AuthProvider>
            <OrgHierarchyProvider>
              <NotificationsProvider>
                {children}
                <Toaster />
              </NotificationsProvider>
            </OrgHierarchyProvider>
          </AuthProvider>
        </DisplayTitleProvider>
      </RolesProvider>
    </ThemeProvider>
  )
}
