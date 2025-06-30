"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Facebook, Twitter, Linkedin, Instagram, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { SocialMediaLinks } from "@/lib/auth-context"

interface SocialMediaEditorProps {
  socialLinks: SocialMediaLinks
  onSave: (links: SocialMediaLinks) => void
}

export function SocialMediaEditor({ socialLinks, onSave }: SocialMediaEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [links, setLinks] = useState<SocialMediaLinks>(socialLinks || {})
  const { toast } = useToast()

  const handleSave = () => {
    // Validate all URLs before saving
    const validatedLinks = {
      facebook: validateUrl(links.facebook || ""),
      twitter: validateUrl(links.twitter || ""),
      linkedin: validateUrl(links.linkedin || ""),
      instagram: validateUrl(links.instagram || ""),
    }

    onSave(validatedLinks)
    setIsOpen(false)
    toast({
      title: "Social media links updated",
      description: "Your social media links have been updated successfully.",
    })
  }

  const handleChange = (platform: keyof SocialMediaLinks, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [platform]: value,
    }))
  }

  const validateUrl = (url: string): string => {
    if (!url) return url

    // Add https:// if missing
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }

    return url
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-3">
        {/* Facebook */}
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${socialLinks?.facebook ? "bg-blue-100 hover:bg-blue-200" : ""}`}
          asChild={!!socialLinks?.facebook}
          onClick={() => !socialLinks?.facebook && setIsOpen(true)}
        >
          {socialLinks?.facebook ? (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Profile">
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="sr-only">Facebook</span>
            </a>
          ) : (
            <Facebook className="h-5 w-5" />
          )}
        </Button>

        {/* Twitter */}
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${socialLinks?.twitter ? "bg-sky-100 hover:bg-sky-200" : ""}`}
          asChild={!!socialLinks?.twitter}
          onClick={() => !socialLinks?.twitter && setIsOpen(true)}
        >
          {socialLinks?.twitter ? (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter Profile">
              <Twitter className="h-5 w-5 text-sky-500" />
              <span className="sr-only">Twitter</span>
            </a>
          ) : (
            <Twitter className="h-5 w-5" />
          )}
        </Button>

        {/* LinkedIn */}
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${socialLinks?.linkedin ? "bg-blue-100 hover:bg-blue-200" : ""}`}
          asChild={!!socialLinks?.linkedin}
          onClick={() => !socialLinks?.linkedin && setIsOpen(true)}
        >
          {socialLinks?.linkedin ? (
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <span className="sr-only">LinkedIn</span>
            </a>
          ) : (
            <Linkedin className="h-5 w-5" />
          )}
        </Button>

        {/* Instagram */}
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${socialLinks?.instagram ? "bg-pink-100 hover:bg-pink-200" : ""}`}
          asChild={!!socialLinks?.instagram}
          onClick={() => !socialLinks?.instagram && setIsOpen(true)}
        >
          {socialLinks?.instagram ? (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram Profile">
              <Instagram className="h-5 w-5 text-pink-600" />
              <span className="sr-only">Instagram</span>
            </a>
          ) : (
            <Instagram className="h-5 w-5" />
          )}
        </Button>

        {/* Edit button */}
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit social media links</span>
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Social Media Links</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" /> Facebook
            </Label>
            <Input
              id="facebook"
              value={links.facebook || ""}
              onChange={(e) => handleChange("facebook", e.target.value)}
              placeholder="https://facebook.com/yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" /> Twitter
            </Label>
            <Input
              id="twitter"
              value={links.twitter || ""}
              onChange={(e) => handleChange("twitter", e.target.value)}
              placeholder="https://twitter.com/yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" /> LinkedIn
            </Label>
            <Input
              id="linkedin"
              value={links.linkedin || ""}
              onChange={(e) => handleChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" /> Instagram
            </Label>
            <Input
              id="instagram"
              value={links.instagram || ""}
              onChange={(e) => handleChange("instagram", e.target.value)}
              placeholder="https://instagram.com/yourusername"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
