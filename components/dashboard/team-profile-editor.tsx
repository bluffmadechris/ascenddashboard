"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRoles } from "@/lib/roles-context"
import { useDisplayTitle } from "@/lib/display-title-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  UserPlus,
  Save,
  X,
  Plus,
  Trash2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { TeamMemberCard } from "@/components/dashboard/team-member-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SocialMediaLinks, CustomLink } from "@/lib/auth-context"
import { saveData } from "@/lib/data-persistence"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AvatarUpload } from "@/components/profile/avatar-upload"

export function TeamProfileEditor() {
  const { users, updateUser } = useAuth()
  const { roles } = useRoles()
  const { getDisplayTitle, updateDisplayTitle } = useDisplayTitle()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    title: "",
    bio: "",
    avatar: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      youtube: "",
      customLinks: [] as CustomLink[],
    },
  })
  const [previewVisible, setPreviewVisible] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [originalFormData, setOriginalFormData] = useState(formData)

  // Format role name for display - memoized to prevent recalculation
  const formatRoleName = useCallback((role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }, [])

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Load user data when a user is selected
  useEffect(() => {
    if (selectedUserId) {
      const selectedUser = users.find((u) => u.id === selectedUserId)
      if (selectedUser) {
        // Get the custom display title if it exists, otherwise use formatted role name
        const displayTitle = getDisplayTitle(selectedUser.id, formatRoleName(selectedUser.role))

        const newFormData = {
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          title: displayTitle,
          bio: selectedUser.bio || "",
          avatar: selectedUser.avatar || "",
          socialMedia: {
            facebook: selectedUser.socialMedia?.facebook || "",
            twitter: selectedUser.socialMedia?.twitter || "",
            linkedin: selectedUser.socialMedia?.linkedin || "",
            instagram: selectedUser.socialMedia?.instagram || "",
            youtube: selectedUser.socialMedia?.youtube || "",
            customLinks: selectedUser.socialMedia?.customLinks || [],
          },
        }
        setFormData(newFormData)
        setOriginalFormData(newFormData)
        setHasUnsavedChanges(false)
        setSaveStatus("idle")
      }
    }
  }, [selectedUserId, users, getDisplayTitle, formatRoleName])

  // Check for unsaved changes when form data changes
  useEffect(() => {
    if (selectedUserId) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData)
      setHasUnsavedChanges(hasChanges)

      // Reset save status when changes are made after a successful save
      if (hasChanges && saveStatus === "success") {
        setSaveStatus("idle")
      }
    }
  }, [formData, originalFormData, selectedUserId, saveStatus])

  const handleUserSelect = (userId: string) => {
    // Check for unsaved changes before switching users
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Are you sure you want to switch users without saving?",
      )
      if (!confirmSwitch) {
        return
      }
    }

    setSelectedUserId(userId)
    setPreviewVisible(false)
    setActiveTab("basic")
    setSaveStatus("idle")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSocialMediaChange = (platform: keyof SocialMediaLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }))
  }

  const handleAddCustomLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        customLinks: [...prev.socialMedia.customLinks, { title: "", url: "" }],
      },
    }))
  }

  const handleCustomLinkChange = (index: number, field: "title" | "url", value: string) => {
    setFormData((prev) => {
      const updatedLinks = [...prev.socialMedia.customLinks]
      updatedLinks[index] = { ...updatedLinks[index], [field]: value }
      return {
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          customLinks: updatedLinks,
        },
      }
    })
  }

  const handleRemoveCustomLink = (index: number) => {
    setFormData((prev) => {
      const updatedLinks = [...prev.socialMedia.customLinks]
      updatedLinks.splice(index, 1)
      return {
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          customLinks: updatedLinks,
        },
      }
    })
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
      title: formatRoleName(value),
    }))
  }

  const togglePreview = () => {
    setPreviewVisible(!previewVisible)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaveStatus("saving")

    try {
      if (!selectedUserId) {
        throw new Error("No user selected")
      }

      // Update the display title in the context
      if (formData.title !== formatRoleName(formData.role)) {
        updateDisplayTitle(selectedUserId, formData.title)
      }

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar,
        socialMedia: {
          facebook: formData.socialMedia.facebook,
          twitter: formData.socialMedia.twitter,
          linkedin: formData.socialMedia.linkedin,
          instagram: formData.socialMedia.instagram,
          youtube: formData.socialMedia.youtube,
          customLinks: formData.socialMedia.customLinks.filter((link) => link.title && link.url),
        },
      }

      // If role has changed, update it
      const selectedUser = users.find((u) => u.id === selectedUserId)
      if (selectedUser && selectedUser.role !== formData.role) {
        updateData.role = formData.role
      }

      // Update user profile
      const success = await updateUser(selectedUserId, updateData)

      if (success) {
        // Update the original form data to match the current state
        setOriginalFormData({ ...formData })
        setHasUnsavedChanges(false)
        setSaveStatus("success")

        toast({
          title: "Success",
          description: "Team member profile updated successfully.",
          variant: "default",
        })

        // Force update local storage to ensure changes are persisted
        const updatedUsers = users.map((u) => (u.id === selectedUserId ? { ...u, ...updateData } : u))
        saveData("users", updatedUsers)

        // Reset success status after 3 seconds
        setTimeout(() => {
          setSaveStatus((current) => (current === "success" ? "idle" : current))
        }, 3000)
      } else {
        throw new Error("Failed to update team member profile")
      }
    } catch (error) {
      setSaveStatus("error")
      toast({
        title: "Error",
        description: "Failed to update team member profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?")
      if (confirmCancel) {
        setFormData({ ...originalFormData })
        setHasUnsavedChanges(false)
        setSaveStatus("idle")
      }
    } else {
      setSelectedUserId(null)
    }
  }

  // Get user category for preview
  const getUserCategory = (userRole: string): string => {
    if (userRole === "owner" || userRole === "president" || userRole === "ceo") {
      return "owner"
    }
    if (
      userRole === "manager" ||
      userRole === "youtube_manager" ||
      userRole.includes("manager") ||
      userRole.includes("director") ||
      userRole.includes("lead")
    ) {
      return "management"
    }
    return "creative"
  }

  // Get role color based on category
  const getRoleColor = (category: string): string => {
    switch (category) {
      case "owner":
        return "bg-purple-100 dark:bg-purple-950/40"
      case "management":
        return "bg-blue-100 dark:bg-blue-950/40"
      case "creative":
        return "bg-amber-100 dark:bg-amber-950/40"
      default:
        return "bg-gray-100 dark:bg-gray-800"
    }
  }

  // Get role icon based on category
  const getRoleIcon = (category: string): string => {
    switch (category) {
      case "owner":
        return "👑"
      case "management":
        return "📊"
      case "creative":
        return "✨"
      default:
        return "🔹"
    }
  }

  // Render save button with appropriate state
  const renderSaveButton = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <Button type="submit" disabled className="min-w-[100px]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </Button>
        )
      case "success":
        return (
          <Button type="submit" variant="outline" className="bg-green-50 text-green-600 border-green-200 min-w-[100px]">
            <CheckCircle className="mr-2 h-4 w-4" />
            Saved
          </Button>
        )
      case "error":
        return (
          <Button type="submit" variant="destructive" className="min-w-[100px]">
            <Save className="mr-2 h-4 w-4" />
            Retry Save
          </Button>
        )
      default:
        return (
          <Button type="submit" disabled={!hasUnsavedChanges || isSubmitting} className="min-w-[100px]">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Team Members List */}
      <div className="md:col-span-1">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <UserPlus className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No team members found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    className={`cursor-pointer transition-all hover:bg-accent/50 ${selectedUserId === user.id ? "border-primary" : ""
                      }`}
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getDisplayTitle(user.id, formatRoleName(user.role))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Edit Form */}
      <div className="md:col-span-2">
        {selectedUserId ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Edit Team Member Profile</h3>
              <Button variant="outline" size="sm" onClick={togglePreview}>
                {previewVisible ? "Edit Profile" : "Preview"}
              </Button>
            </div>

            {previewVisible ? (
              <div className="flex justify-center py-4">
                <TeamMemberCard
                  user={{
                    ...users.find((u) => u.id === selectedUserId)!,
                    role: formData.title,
                    bio: formData.bio,
                    avatar: formData.avatar,
                    name: formData.name,
                    socialMedia: formData.socialMedia,
                  }}
                  showContactInfo={true}
                  onToggleVisibility={() => { }}
                  roleColor={getRoleColor(getUserCategory(formData.role))}
                  roleIcon={getRoleIcon(getUserCategory(formData.role))}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {hasUnsavedChanges && (
                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertDescription>
                      You have unsaved changes. Don't forget to save before leaving this page.
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="basic" className="flex-1">
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex-1">
                      Social Media
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email (read-only)</Label>
                        <Input id="email" name="email" value={formData.email} readOnly disabled />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} onValueChange={handleRoleChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Changing a role affects permissions.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">
                          Display Title <span className="text-xs text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="E.g., Creative Director, Lead Designer"
                        />
                        <p className="text-xs text-muted-foreground">Custom title appears on the team page</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Profile Picture <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <div className="flex justify-center py-4">
                        <AvatarUpload
                          currentAvatar={formData.avatar}
                          name={formData.name}
                          onAvatarChange={(newAvatar) => setFormData(prev => ({ ...prev, avatar: newAvatar }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Click on the avatar to upload a new profile picture
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">
                        Bio <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Enter a short bio"
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Facebook className="h-4 w-4" /> Facebook
                          </Label>
                          <Input
                            value={formData.socialMedia.facebook}
                            onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                            placeholder="https://facebook.com/username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Twitter className="h-4 w-4" /> Twitter
                          </Label>
                          <Input
                            value={formData.socialMedia.twitter}
                            onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" /> LinkedIn
                          </Label>
                          <Input
                            value={formData.socialMedia.linkedin}
                            onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" /> Instagram
                          </Label>
                          <Input
                            value={formData.socialMedia.instagram}
                            onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                            placeholder="https://instagram.com/username"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Youtube className="h-4 w-4" /> YouTube
                        </Label>
                        <Input
                          value={formData.socialMedia.youtube}
                          onChange={(e) => handleSocialMediaChange("youtube", e.target.value)}
                          placeholder="https://youtube.com/c/channelname"
                        />
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Custom Links</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddCustomLink}
                            className="h-8"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Link
                          </Button>
                        </div>

                        {formData.socialMedia.customLinks.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No custom links added yet. Click "Add Link" to create one.
                          </p>
                        ) : (
                          formData.socialMedia.customLinks.map((link, index) => (
                            <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-start">
                              <div>
                                <Input
                                  value={link.title}
                                  onChange={(e) => handleCustomLinkChange(index, "title", e.target.value)}
                                  placeholder="Link Title"
                                />
                              </div>
                              <div>
                                <Input
                                  value={link.url}
                                  onChange={(e) => handleCustomLinkChange(index, "url", e.target.value)}
                                  placeholder="https://example.com"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCustomLink(index)}
                                className="h-10 w-10"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    <X className="mr-2 h-4 w-4" />
                    {hasUnsavedChanges ? "Discard Changes" : "Cancel"}
                  </Button>
                  {renderSaveButton()}
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 border border-dashed rounded-lg">
            <UserPlus className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Team Member Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              Select a team member from the list to edit their profile information. Changes will be immediately
              reflected on the team page.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
