"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Upload, Link, X } from "lucide-react"
import { getInitials, normalizeAvatarUrl, isValidAvatarUrl } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  name = "User Name",
  disabled = false,
}: {
  currentAvatar: string
  onAvatarChange: (url: string) => void
  name?: string
  disabled?: boolean
}) {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('avatar', file)

      // Get auth token
      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        throw new Error('Authentication token not found')
      }

      // Upload to the backend using the API client's base URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Upload failed: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to upload avatar')
      }

      // Use the signed URL for immediate display, fallback to regular URL
      const newAvatarUrl = result.data.signed_url || result.data.avatar_url

      // Update the avatar through the parent component callback
      onAvatarChange(newAvatarUrl)

      // Also update through API client to ensure consistent state
      try {
        await apiClient.updateUser(user.id, {
          avatar: result.data.avatar_url // Use the permanent URL for persistence
        })
      } catch (apiError) {
        console.error('Failed to update avatar through API client:', apiError)
        // Don't fail the upload if this fails, as the file was already uploaded
      }

      setIsDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully.'
      })
    } catch (error) {
      console.error('Avatar upload error:', error)

      // Check if it's an AWS configuration error
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile picture'

      if (error instanceof Error && (error.message?.includes('AWS S3 configuration') || error.message?.includes('File upload is currently unavailable'))) {
        toast({
          title: 'File Upload Unavailable',
          description: 'File upload is currently unavailable. Please use the "Use URL" tab to set your profile picture with an image URL.',
          variant: 'destructive',
        })
        // Automatically switch to URL tab
        const urlTab = document.querySelector('[data-value="url"]') as HTMLElement
        if (urlTab) {
          urlTab.click()
        }
      } else {
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUrlUpload = async () => {
    if (!user || !urlInput.trim()) return

    const url = urlInput.trim()

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
        description: "Stock photo services don't allow direct image links. Please download the image first and upload it, or use one of the suggested placeholder services.",
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

      // Update the avatar URL using the API client
      const response = await apiClient.updateUser(user.id, {
        avatar: url
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile picture')
      }

      // Update the global user state and local state
      onAvatarChange(url)
      setIsDialogOpen(false)
      setUrlInput("")
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

  const handleRemoveAvatar = async () => {
    if (!user) return

    setIsUploading(true)

    try {
      const response = await apiClient.updateUser(user.id, {
        avatar: ""
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to remove profile picture')
      }

      onAvatarChange("")
      setIsDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Profile picture removed successfully.'
      })
    } catch (error) {
      console.error('Avatar removal error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove profile picture',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <Avatar className="h-24 w-24">
        <AvatarImage
          src={normalizeAvatarUrl(currentAvatar) || "/placeholder.svg"}
          alt="Profile picture"
        />
        <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
      </Avatar>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white transition-opacity ${isHovering || isUploading ? 'opacity-100' : 'opacity-0'}`}
            disabled={isUploading || disabled}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
            <span className="sr-only">Change profile picture</span>
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="url">Use URL</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Choose an image file</Label>
                <Input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, GIF up to 5MB
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-yellow-600">
                    Debug: Using API URL {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">Image URL</Label>
                <Input
                  id="url-input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={isUploading || disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Try: <code className="bg-muted px-1 rounded">https://picsum.photos/400/400</code> or <code className="bg-muted px-1 rounded">https://placehold.co/400x400.png</code>
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Direct image links (ending in .jpg, .png, .gif, .webp)</p>
                  <p>• Placeholder services: picsum.photos, placehold.co</p>
                  <p>• Avoid stock photo sites (they block direct links)</p>
                </div>
              </div>

              <Button
                onClick={handleUrlUpload}
                disabled={isUploading || !urlInput.trim() || disabled}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Use This URL
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {isValidAvatarUrl(currentAvatar) && (
            <div className="border-t pt-4">
              <Button
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                variant="outline"
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Remove Current Picture
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
