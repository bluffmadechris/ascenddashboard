"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  socialMedia?: {
    twitter?: string
    linkedin?: string
    instagram?: string
    facebook?: string
    youtube?: string
    customLinks?: Array<{ title: string; url: string; }>
  }
  contactVisible: boolean
}

export function ProfileEditor() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    socialMedia: {},
    contactVisible: false
  })

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        bio: user.bio || "",
        socialMedia: user.socialMedia || {},
        contactVisible: user.contactVisible || false
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create a copy of the form data
      const updates = { ...formData }

      console.log('Original form data:', formData); // Debug log

      // Only include non-empty social media links
      if (updates.socialMedia) {
        const cleanSocialMedia: ProfileData['socialMedia'] = {}
        Object.entries(updates.socialMedia).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            cleanSocialMedia[key as keyof typeof cleanSocialMedia] = value.trim()
          } else if (key === 'customLinks' && Array.isArray(value)) {
            const validCustomLinks = value.filter(link => link.title && link.url)
            if (validCustomLinks.length > 0) {
              cleanSocialMedia.customLinks = validCustomLinks
            }
          }
        })
        updates.socialMedia = Object.keys(cleanSocialMedia).length > 0 ? cleanSocialMedia : undefined
      }

      // Ensure bio is included in updates
      if (updates.bio === "") {
        updates.bio = null
      }

      console.log('Updates being sent:', updates); // Debug log

      const response = await api.updateUser(user?.id, updates)
      if (response.success) {
        updateUser(response.data.user)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('Profile update error:', error); // Debug log
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      })
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
        currentUrl={user?.avatar}
        onUpload={async (url) => {
          try {
            const response = await api.updateUser(user?.id, { avatar: url })
            if (response.success) {
              updateUser(response.data.user)
              toast({
                title: "Success",
                description: "Profile picture updated"
              })
            } else {
              throw new Error(response.message)
            }
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to update profile picture",
              variant: "destructive"
            })
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

        <div>
          <label className="block text-sm font-medium mb-1">Social Media</label>
          <SocialMediaEditor
            socialLinks={formData.socialMedia || {}}
            onSave={(links) => setFormData(prev => ({ ...prev, socialMedia: links }))}
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        )}
      </form>
    </div>
  )
}
