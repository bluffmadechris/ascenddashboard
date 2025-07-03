"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api-client"

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

  const handleChangeAvatarUrl = async () => {
    if (!user) return

    const url = window.prompt(
      "Enter the URL of your profile picture:\n\nRecommended services:\n" +
      "1. https://picsum.photos/400/400 (random beautiful photo)\n" +
      "2. https://placehold.co/400x400.png (simple placeholder)\n" +
      "3. https://via.placeholder.com/400.jpg (another placeholder)\n\n" +
      "Note: Stock photo services (like iStock, Shutterstock) don't allow direct image links. " +
      "Please download the image first and upload it to your own hosting, or use one of the services above."
    )?.trim()
    if (!url) return

    // Basic validation with special cases for known image services
    const knownImageServices = [
      'picsum.photos',
      'placehold.co',
      'via.placeholder.com',
      'placekitten.com',
      'placeimg.com'
    ]

    const isKnownService = knownImageServices.some(domain => url.includes(domain))
    const hasImageExtension = /\.(png|jpe?g|gif|webp|svg)$/i.test(url)

    if (!isKnownService && !hasImageExtension) {
      toast({
        title: "Invalid URL",
        description: "Please provide either a direct link to an image file (ending in .jpg, .png, etc) or use one of the suggested image services.",
        variant: "destructive",
      })
      return
    }

    // Check for common stock photo services that block direct access
    const blockedDomains = [
      'istockphoto.com',
      'shutterstock.com',
      'gettyimages.com',
      'adobe.stock.com',
      'alamy.com'
    ]

    if (blockedDomains.some(domain => url.includes(domain))) {
      toast({
        title: "Stock Photo Detected",
        description: "Stock photo services don't allow direct image links. Please download the image first and upload it to your own hosting, or use one of the suggested placeholder services.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Verify the image URL is accessible
      try {
        const imgResponse = await fetch(url, { method: 'HEAD' })
        if (!imgResponse.ok) {
          throw new Error('Image not accessible')
        }
        // For known services, we trust they return images
        if (!isKnownService) {
          // Verify it's an image by checking Content-Type
          const contentType = imgResponse.headers.get('Content-Type')
          if (!contentType?.startsWith('image/')) {
            throw new Error('URL does not point to an image')
          }
        }
      } catch (error) {
        throw new Error(
          'The image URL is not accessible. Please try:\n' +
          '1. Using one of the suggested placeholder services\n' +
          '2. Checking if the URL is correct and publicly accessible\n' +
          '3. Using a different image hosting service'
        )
      }

      // Send all required fields to avoid 400 Bad Request
      const response = await apiClient.updateUser(user.id, {
        name: user.name,
        avatar: url,
        phone: user.phone,
        title: user.title,
        department: user.department,
        role: user.role
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile picture')
      }

      onAvatarChange(url)
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully.'
      })
    } catch (error) {
      console.error('Avatar URL update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile picture',
        variant: 'destructive',
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

      <button
        type="button"
        onClick={handleChangeAvatarUrl}
        className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white transition-opacity ${isHovering || isUploading ? 'opacity-100' : 'opacity-0'}`}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
        <span className="sr-only">Change profile picture URL</span>
      </button>
    </div>
  )
}
