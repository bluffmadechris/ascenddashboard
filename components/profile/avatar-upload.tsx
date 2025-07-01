"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  name = "User Name",
}: {
  currentAvatar: string
  onAvatarChange: (url: string) => void
  name?: string
}) {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('avatar', file)

      // Upload to S3 through our API
      const response = await fetch(`/api/users/${user?.id}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile picture')
      }

      // Update avatar with the signed URL from the response
      onAvatarChange(data.data.user.avatar_url)
      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error uploading image",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <Avatar className="h-24 w-24">
        <AvatarImage src={currentAvatar || "/placeholder.svg"} alt="Profile picture" />
        <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
      </Avatar>

      <label
        htmlFor="avatar-upload"
        className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white transition-opacity cursor-pointer ${isHovering || isUploading ? "opacity-100" : "opacity-0"
          }`}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
        <span className="sr-only">Upload new avatar</span>
      </label>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  )
}
