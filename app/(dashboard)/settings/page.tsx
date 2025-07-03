"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [settings, setSettings] = useState({
    darkMode: user?.settings?.darkMode || false,
    language: user?.settings?.language || "en",
    timezone: user?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      await api.put(`/users/${user?.id}/settings`, settings)
      updateUser({ ...user, settings })
      toast.success("Settings updated successfully")
    } catch (error) {
      toast.error("Failed to update settings")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Dark Mode</label>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              className="w-full p-2 border rounded-md"
              value={settings.language}
              onChange={(e) => handleSettingChange("language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <Input
              type="text"
              value={settings.timezone}
              onChange={(e) => handleSettingChange("timezone", e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
