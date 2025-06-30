"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Youtube,
  Globe,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
} from "lucide-react"
import { Meteors } from "@/components/ui/meteors"
import type { SocialMediaLinks } from "@/lib/auth-context"

interface SocialPlatform {
  key: keyof SocialMediaLinks
  name: string
  icon: React.ReactNode
  placeholder: string
  color: string
  bgColor: string
}

const DEFAULT_PLATFORMS: SocialPlatform[] = [
  {
    key: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    placeholder: "https://facebook.com/yourusername",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    key: "twitter",
    name: "Twitter",
    icon: <Twitter className="h-5 w-5" />,
    placeholder: "https://twitter.com/yourusername",
    color: "text-sky-500",
    bgColor: "bg-sky-100",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    placeholder: "https://linkedin.com/in/yourusername",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    placeholder: "https://instagram.com/yourusername",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    key: "github",
    name: "GitHub",
    icon: <Github className="h-5 w-5" />,
    placeholder: "https://github.com/yourusername",
    color: "text-gray-900",
    bgColor: "bg-gray-100",
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: <Youtube className="h-5 w-5" />,
    placeholder: "https://youtube.com/c/yourchannel",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    key: "website",
    name: "Website",
    icon: <Globe className="h-5 w-5" />,
    placeholder: "https://yourwebsite.com",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
]

export default function SocialMediaPage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [links, setLinks] = useState<SocialMediaLinks>({})
  const [customLinks, setCustomLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newCustomTitle, setNewCustomTitle] = useState("")
  const [newCustomUrl, setNewCustomUrl] = useState("")

  // Load user data
  useEffect(() => {
    if (user) {
      setLinks(user.socialMedia || {})

      // Extract custom links if they exist
      const customLinksFromUser = user.customLinks || []
      setCustomLinks(customLinksFromUser)
    }
  }, [user])

  const handleChange = (platform: keyof SocialMediaLinks, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [platform]: value,
    }))
  }

  const handleCustomLinkChange = (id: string, field: "title" | "url", value: string) => {
    setCustomLinks((prev) => prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const addCustomLink = () => {
    if (!newCustomTitle || !newCustomUrl) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and URL for your custom link.",
        variant: "destructive",
      })
      return
    }

    const newLink = {
      id: Date.now().toString(),
      title: newCustomTitle,
      url: validateUrl(newCustomUrl),
    }

    setCustomLinks((prev) => [...prev, newLink])
    setNewCustomTitle("")
    setNewCustomUrl("")
  }

  const removeCustomLink = (id: string) => {
    setCustomLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const validateUrl = (url: string): string => {
    if (!url) return ""

    // Add https:// if missing
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }

    return url
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Validate all URLs before saving
      const validatedLinks = Object.fromEntries(
        Object.entries(links).map(([key, value]) => [key, validateUrl(value || "")]),
      ) as SocialMediaLinks

      // Validate custom links
      const validatedCustomLinks = customLinks.map((link) => ({
        ...link,
        url: validateUrl(link.url),
      }))

      const success = await updateProfile(user?.id || "", {
        socialMedia: validatedLinks,
        customLinks: validatedCustomLinks,
      })

      if (success) {
        toast({
          title: "Social media links updated",
          description: "Your social media links have been updated successfully.",
        })
        router.push("/profile")
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update social media links.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating your social media links.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <Meteors number={10} className="opacity-40" />

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl">Social Media Links</CardTitle>
          <CardDescription>
            Add your social media profiles to share with others. These links will appear on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {DEFAULT_PLATFORMS.map((platform) => (
            <div key={platform.key} className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${platform.bgColor}`}>
                <span className={platform.color}>{platform.icon}</span>
              </div>
              <div className="flex-1">
                <Label htmlFor={`social-${platform.key}`} className="mb-1 block">
                  {platform.name}
                </Label>
                <Input
                  id={`social-${platform.key}`}
                  value={links[platform.key] || ""}
                  onChange={(e) => handleChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl">Custom Links</CardTitle>
          <CardDescription>Add any other links you'd like to share on your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {customLinks.map((link) => (
            <div key={link.id} className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Globe className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={link.title}
                  onChange={(e) => handleCustomLinkChange(link.id, "title", e.target.value)}
                  placeholder="Link Title"
                  className="mb-2"
                />
                <Input
                  value={link.url}
                  onChange={(e) => handleCustomLinkChange(link.id, "url", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-red-500 hover:bg-red-100 hover:text-red-600"
                onClick={() => removeCustomLink(link.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}

          <div className="flex items-start gap-4 pt-4 border-t border-border/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Plus className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={newCustomTitle}
                onChange={(e) => setNewCustomTitle(e.target.value)}
                placeholder="Link Title"
                className="mb-2"
              />
              <Input
                value={newCustomUrl}
                onChange={(e) => setNewCustomUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <Button variant="outline" className="h-10 mt-4" onClick={addCustomLink}>
              Add Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  )
}
