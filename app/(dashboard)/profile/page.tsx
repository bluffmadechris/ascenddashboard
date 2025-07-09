"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Pencil,
  Check,
  X,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Youtube,
  Globe,
  LinkIcon,
  Calendar,
} from "lucide-react"
import { Meteors } from "@/components/ui/meteors"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { SocialMediaEditor } from "@/components/profile/social-media-editor"
import type { SocialMediaLinks } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, changePassword, updateProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatar, setAvatar] = useState<string>("")
  const [socialLinks, setSocialLinks] = useState<SocialMediaLinks>({})

  // Get user initials for the avatar
  const getInitials = () => {
    if (!firstName && !lastName) return user?.name?.charAt(0) || "U"
    if (!lastName) return firstName.charAt(0)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  // Load user data
  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(" ") || ["", ""]
      setFirstName(nameParts[0] || "")
      setLastName(nameParts.slice(1).join(" ") || "")
      setEmail(user.email || "")
      setBio(user.bio || "")
      setJobTitle(
        user.role === "owner" ? "Owner" : user.role === "employee" ? "Team Member" : user.role?.replace("_", " ") || "",
      )
      setAvatar(user.avatar || "")
      setSocialLinks(user.socialMedia || {})
    }
  }, [user])

  const handleSavePersonalInfo = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Update user profile
      const fullName = `${firstName} ${lastName}`.trim()
      const success = await updateProfile(String(user.id), {
        name: fullName,
        bio: bio,
        avatar: avatar,
        socialMedia: socialLinks,
        email: email,
        role: user.role,
        phone: user.phone,
        title: user.title,
        department: user.department
      })

      if (success) {
        setIsEditing(false)
        setEditingSection(null)
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
      console.error('Profile update error:', error)
      toast({
        title: "Error",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePassword = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Validate passwords
    if (!password) {
      toast({
        title: "Current password required",
        description: "Please enter your current password.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!newPassword) {
      toast({
        title: "New password required",
        description: "Please enter a new password.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Call the changePassword method from auth context
      const success = await changePassword(String(user.id), password, newPassword)

      if (success) {
        setEditingSection(null)
        setPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully. You can use it next time you log in.",
        })
      } else {
        toast({
          title: "Password update failed",
          description: "Your current password is incorrect.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Password update error:', error)
      toast({
        title: "Error",
        description: "An error occurred while updating your password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = async (newAvatar: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user found. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    try {
      setAvatar(newAvatar)
      if (!isEditing) {
        const success = await updateProfile(String(user.id), {
          avatar: newAvatar
        })

        if (success) {
          toast({
            title: "Profile picture updated",
            description: "Your profile picture has been updated successfully.",
          })
        } else {
          toast({
            title: "Update failed",
            description: "Failed to update profile picture.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Avatar update error:', error)
      toast({
        title: "Error",
        description: "Failed to update profile picture.",
        variant: "destructive",
      })
    }
  }

  const handleSocialLinksUpdate = async (newLinks: SocialMediaLinks) => {
    try {
      setSocialLinks(newLinks)
      if (!isEditing) {
        const success = await updateProfile(String(user?.id || ""), {
          socialMedia: newLinks,
        })

        if (success) {
          toast({
            title: "Social links updated",
            description: "Your social media links have been updated successfully.",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update social media links.",
        variant: "destructive",
      })
    }
  }

  const handleRequestMeeting = () => {
    if (user?.role === "owner") {
      router.push("/calendar")
    } else if (user?.role === "employee") {
      router.push("/schedule-meeting")
    } else {
      toast({
        title: "Permission denied",
        description: "Only employees can request meetings. Owners can directly schedule them.",
        variant: "destructive",
      })
    }
  }

  const handleEditAll = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setIsEditing(false)
  }

  const handleSaveAll = async () => {
    setIsLoading(true)

    try {
      // Update user profile
      const fullName = `${firstName} ${lastName}`.trim()
      const success = await updateProfile(String(user?.id || ""), {
        name: fullName,
        bio: bio,
        avatar: avatar,
        socialMedia: socialLinks,
      })

      if (success) {
        setIsEditing(false)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
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

  // Get icon for a platform
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5" />
      case "twitter":
        return <Twitter className="h-5 w-5" />
      case "linkedin":
        return <Linkedin className="h-5 w-5" />
      case "instagram":
        return <Instagram className="h-5 w-5" />
      case "github":
        return <Github className="h-5 w-5" />
      case "youtube":
        return <Youtube className="h-5 w-5" />
      case "website":
        return <Globe className="h-5 w-5" />
      default:
        return <LinkIcon className="h-5 w-5" />
    }
  }

  // Get color for a platform
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "text-blue-600 bg-blue-100"
      case "twitter":
        return "text-sky-500 bg-sky-100"
      case "linkedin":
        return "text-blue-700 bg-blue-100"
      case "instagram":
        return "text-pink-600 bg-pink-100"
      case "github":
        return "text-gray-900 bg-gray-100"
      case "youtube":
        return "text-red-600 bg-red-100"
      case "website":
        return "text-purple-600 bg-purple-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!isEditing ? (
              <Button onClick={handleEditAll}>Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAll}>Save Changes</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <AvatarUpload currentAvatar={avatar} onAvatarChange={handleAvatarChange} />
          </div>

          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                className="h-24"
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div>
            <Label className="mb-2 block">Social Media</Label>
            <SocialMediaEditor socialLinks={socialLinks} onSave={handleSocialLinksUpdate} />
          </div>

          {/* Meeting Request Button */}
          {user?.role === "employee" && (
            <div className="flex justify-center mt-4">
              <Button onClick={handleRequestMeeting} className="gap-2">
                <Calendar className="h-4 w-4" />
                Request Meeting
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleSavePassword} disabled={isLoading}>
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
