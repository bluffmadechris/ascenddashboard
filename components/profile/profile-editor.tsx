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

type ProfileData = {
  name: string
  email: string
  phone: string
  avatar: string
  bio: string
  twitter?: string
  linkedin?: string
  instagram?: string
}

export function ProfileEditor({ initialData }: { initialData: ProfileData }) {
  const [profileData, setProfileData] = useState<ProfileData>(initialData)
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (avatarUrl: string) => {
    setProfileData((prev) => ({ ...prev, avatar: avatarUrl }))
  }

  const handleSocialChange = (platform: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [platform]: value }))
  }

  const handleSave = () => {
    // In a real app, you would save to a database here
    console.log("Saving profile data:", profileData)

    // Simulate saving to database
    setTimeout(() => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      setIsOpen(false)
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="mx-auto mb-4">
            <AvatarUpload currentAvatar={profileData.avatar} onAvatarChange={handleAvatarChange} />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" name="name" value={profileData.name} onChange={handleChange} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={profileData.phone}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Bio
            </Label>
            <Input id="bio" name="bio" value={profileData.bio} onChange={handleChange} className="col-span-3" />
          </div>

          <div className="mt-2">
            <Label className="mb-2 block">Social Media</Label>
            <SocialMediaEditor
              socialLinks={{
                twitter: profileData.twitter || "",
                linkedin: profileData.linkedin || "",
                instagram: profileData.instagram || "",
              }}
              onChange={handleSocialChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
