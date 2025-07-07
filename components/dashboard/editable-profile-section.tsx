"use client"

import { useState, useEffect } from "react"
import { EditableSection } from "@/components/ui/editable-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export function EditableProfileSection() {
  const { toast } = useToast()
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setBio(user.bio || "")
      setEmail(user.email || "")
    }
  }, [user])

  const handleSave = async () => {
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
      const success = await updateProfile(user.id.toString(), {
        name: name.trim(),
        bio: bio.trim(),
        email: email.trim(),
      })

      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        })
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update profile information. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const profileContent = (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
        <p className="text-lg">{name || "Not set"}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Bio</h4>
        <p className="text-lg">{bio || "No bio available"}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
        <p className="text-lg">{email || "Not set"}</p>
      </div>
    </div>
  )

  const editForm = (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={3}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
        />
      </div>
    </div>
  )

  return (
    <EditableSection
      id="profile-section"
      title="Profile Information"
      editForm={editForm}
      onSave={handleSave}
      isLoading={isLoading}
    >
      {profileContent}
    </EditableSection>
  )
}
