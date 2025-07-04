"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordChangeRequestForm } from "@/components/dashboard/password-change-request-form"

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="grid gap-6">
        <PasswordChangeRequestForm />
        {/* Add other settings sections here */}
      </div>
    </div>
  )
}
