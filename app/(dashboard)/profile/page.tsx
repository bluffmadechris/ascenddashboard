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
} from "lucide-react"
import { Meteors } from "@/components/ui/meteors"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import type { SocialMediaLinks } from "@/lib/auth-context"

export default function ProfilePage() {
  const { user, changePassword, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [location, setLocation] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatar, setAvatar] = useState<string>("")
  const [socialLinks, setSocialLinks] = useState<SocialMediaLinks>({})
  const [customLinks, setCustomLinks] = useState<Array<{ id: string; title: string; url: string }>>([])

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
      setLocation("Arizona, United States") // Default location
      setAvatar(user.avatar || "")
      setSocialLinks(user.socialMedia || {})
      setCustomLinks(user.customLinks || [])
    }
  }, [user])

  const handleSavePersonalInfo = async () => {
    setIsLoading(true)

    try {
      // Update user profile
      const fullName = `${firstName} ${lastName}`.trim()
      const success = await updateProfile(user?.id || "", {
        name: fullName,
        bio: bio,
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
      const success = await changePassword(user?.id || "", password, newPassword)

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
    try {
      const success = await updateProfile(user?.id || "", {
        avatar: newAvatar,
      })

      if (success) {
        setAvatar(newAvatar)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile picture.",
        variant: "destructive",
      })
    }
  }

  const handleEditSection = (section: string) => {
    setEditingSection(section)
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setIsEditing(false)
  }

  const handleEditAll = () => {
    setIsEditing(true)
  }

  const handleSaveAll = async () => {
    setIsLoading(true)

    try {
      // Update user profile
      const fullName = `${firstName} ${lastName}`.trim()
      const success = await updateProfile(user?.id || "", {
        name: fullName,
        bio: bio,
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
    <div className="flex flex-col gap-6 relative">
      <Meteors number={10} className="opacity-40" />

      {/* Profile Header Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm relative z-10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <AvatarUpload
              currentAvatar={avatar}
              name={`${firstName} ${lastName}`}
              onAvatarChange={handleAvatarChange}
            />

            <div className="flex-1 text-center md:text-left">
              {isEditing || editingSection === "header" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  {editingSection === "header" && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button onClick={handleSavePersonalInfo} disabled={isLoading}>
                        {isLoading ? (
                          "Saving..."
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-1">
                    {firstName} {lastName}
                  </h1>
                  <p className="text-muted-foreground text-lg mb-4">
                    {jobTitle} {location && `| ${location}`}
                  </p>
                </>
              )}

              {!isEditing && editingSection !== "header" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {/* Social Media Links */}
                    {Object.entries(socialLinks).map(([platform, url]) =>
                      url ? (
                        <Button
                          key={platform}
                          variant="outline"
                          size="icon"
                          className={`rounded-full ${getPlatformColor(platform)}`}
                          asChild
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${platform} Profile`}>
                            {getPlatformIcon(platform)}
                          </a>
                        </Button>
                      ) : null,
                    )}

                    {/* Custom Links */}
                    {customLinks.map((link) =>
                      link.url ? (
                        <Button
                          key={link.id}
                          variant="outline"
                          size="icon"
                          className="rounded-full text-gray-600 bg-gray-100"
                          asChild
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.title}>
                            <LinkIcon className="h-5 w-5" />
                          </a>
                        </Button>
                      ) : null,
                    )}

                    {/* Manage Social Links Button */}
                    <Button variant="outline" className="gap-2 rounded-full" href="/social-media">
                      <Pencil className="h-4 w-4" />
                      Manage Links
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="gap-2" onClick={handleEditAll}>
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="gap-2" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button className="gap-2" onClick={handleSaveAll} disabled={isLoading}>
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save All
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Personal Information</CardTitle>
          {!isEditing && editingSection !== "personal" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditSection("personal")}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          {isEditing || editingSection === "personal" ? (
            <div className="md:col-span-2 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email address</Label>
                  <Input id="editEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input id="editPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bio">About Me</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell your team members a bit about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-muted-foreground text-right">
                      {bio.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>
              {editingSection === "personal" && (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSavePersonalInfo} disabled={isLoading}>
                    {isLoading ? (
                      "Saving..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email address</p>
                <p className="text-lg font-medium">{email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="text-lg font-medium">{phone || "Not provided"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Bio</p>
                <p className="text-lg">{bio || "No bio provided"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Security</CardTitle>
          {!isEditing && editingSection !== "security" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditSection("security")}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing || editingSection === "security" ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              {editingSection === "security" && (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSavePassword} disabled={isLoading}>
                    {isLoading ? (
                      "Saving..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                </div>
                <p className="text-sm">••••••••</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Two-factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
