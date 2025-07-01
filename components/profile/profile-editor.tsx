"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { SocialMediaEditor } from "@/components/profile/social-media-editor"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Textarea } from "@/components/ui/textarea"

type ProfileData = {
  name: string
  email: string
  phone: string
  avatar: string
  bio: string
  twitter?: string
  linkedin?: string
  instagram?: string
  contactVisible: boolean
}

export function ProfileEditor() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    bio: user?.bio || "",
    email: user?.email || "",
    phone: user?.phone || "",
    contactVisible: user?.contactVisible || false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.put(`/users/${user?.id}/profile`, formData)
      updateUser(response.data)
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profile</h2>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <AvatarUpload
        currentUrl={user?.avatarUrl}
        onUpload={async (url) => {
          try {
            await api.put(`/users/${user?.id}/avatar`, { avatarUrl: url })
            updateUser({ ...user, avatarUrl: url })
            toast.success("Profile picture updated")
          } catch (error) {
            toast.error("Failed to update profile picture")
          }
        }}
        disabled={!isEditing}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={!isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={!isEditing}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="contactVisible"
            checked={formData.contactVisible}
            onChange={(e) => setFormData(prev => ({ ...prev, contactVisible: e.target.checked }))}
            disabled={!isEditing}
          />
          <label htmlFor="contactVisible">Make contact information visible</label>
        </div>

        <SocialMediaEditor disabled={!isEditing} />

        {isEditing && (
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        )}
      </form>
    </div>
  )
}
