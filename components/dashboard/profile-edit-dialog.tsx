"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { Linkedin, Twitter, Youtube, Twitch, Instagram, Github, Globe, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SocialLink {
  id: string
  platform: string
  username: string
}

// Social media platform configurations
const socialPlatforms = {
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    prefix: "linkedin.com/in/",
    placeholder: "username",
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    prefix: "twitter.com/",
    placeholder: "username",
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    prefix: "youtube.com/@",
    placeholder: "channel",
  },
  twitch: {
    name: "Twitch",
    icon: Twitch,
    prefix: "twitch.tv/",
    placeholder: "username",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    prefix: "instagram.com/",
    placeholder: "username",
  },
  github: {
    name: "GitHub",
    icon: Github,
    prefix: "github.com/",
    placeholder: "username",
  },
  website: {
    name: "Website",
    icon: Globe,
    prefix: "",
    placeholder: "https://your-website.com",
  },
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<string>("")
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])

  // Load user data
  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(" ") || ["", ""]
      setFirstName(nameParts[0] || "")
      setLastName(nameParts.slice(1).join(" ") || "")
      setBio(user.bio || "")
      setAvatar(user.avatar || "")

      // Load social links if they exist, otherwise initialize with empty array
      if (user.socialLinks && Array.isArray(user.socialLinks)) {
        setSocialLinks(user.socialLinks)
      } else {
        setSocialLinks([])
      }
    }
  }, [user, open])

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Update user profile
      const fullName = `${firstName} ${lastName}`.trim()
      const success = await updateProfile(user?.id || "", {
        name: fullName,
        bio: bio,
        avatar: avatar,
        socialLinks: socialLinks,
      })

      if (success) {
        onOpenChange(false)
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        })
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update profile information.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (newAvatar: string) => {
    setAvatar(newAvatar)
  }

  const addSocialLink = () => {
    // Find first platform not already in use
    const usedPlatforms = socialLinks.map((link) => link.platform)
    const availablePlatform =
      Object.keys(socialPlatforms).find((platform) => !usedPlatforms.includes(platform)) || "website"

    setSocialLinks([
      ...socialLinks,
      {
        id: crypto.randomUUID(),
        platform: availablePlatform,
        username: "",
      },
    ])
  }

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks(socialLinks.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((link) => link.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 pb-2">
            <AvatarUpload
              currentAvatar={avatar}
              name={`${firstName} ${lastName}`}
              onAvatarChange={handleAvatarChange}
            />
            <p className="text-sm text-muted-foreground">Click to upload a new profile picture</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Social Media Links</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="h-8 px-2">
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>

            {socialLinks.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No social links added yet. Click "Add Link" to get started.
              </div>
            )}

            {socialLinks.map((link) => {
              const platform = socialPlatforms[link.platform as keyof typeof socialPlatforms]
              const Icon = platform?.icon || Globe

              return (
                <div key={link.id} className="flex flex-col space-y-2 p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Select
                      value={link.platform}
                      onValueChange={(value) => updateSocialLink(link.id, "platform", value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(socialPlatforms).map(([key, { name, icon: PlatformIcon }]) => (
                          <SelectItem key={key} value={key} className="flex items-center">
                            <div className="flex items-center">
                              <PlatformIcon className="h-4 w-4 mr-2" />
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSocialLink(link.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {platform.prefix && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{platform.prefix}</span>
                    )}
                    <Input
                      value={link.username}
                      onChange={(e) => updateSocialLink(link.id, "username", e.target.value)}
                      placeholder={platform.placeholder}
                      className="flex-1"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 pt-2 bg-background border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
