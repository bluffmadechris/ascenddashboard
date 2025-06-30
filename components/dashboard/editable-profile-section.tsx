"use client"

import { useState } from "react"
import { EditableSection } from "@/components/ui/editable-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function EditableProfileSection() {
  const { toast } = useToast()
  const [name, setName] = useState("John Doe")
  const [bio, setBio] = useState("Digital Media Professional")
  const [email, setEmail] = useState("john@example.com")

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    })
  }

  const profileContent = (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
        <p className="text-lg">{name}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Bio</h4>
        <p className="text-lg">{bio}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
        <p className="text-lg">{email}</p>
      </div>
    </div>
  )

  const editForm = (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
    </div>
  )

  return (
    <EditableSection id="profile-section" title="Profile Information" editForm={editForm} onSave={handleSave}>
      {profileContent}
    </EditableSection>
  )
}
