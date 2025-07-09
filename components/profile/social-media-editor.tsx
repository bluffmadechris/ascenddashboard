"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SocialMediaLinks {
  twitter?: string
  linkedin?: string
  instagram?: string
  facebook?: string
  youtube?: string
  customLinks?: Array<{ title: string; url: string; }>
}

interface SocialMediaEditorProps {
  socialLinks: SocialMediaLinks
  onSave: (links: SocialMediaLinks) => void
  disabled?: boolean
}

export function SocialMediaEditor({ socialLinks, onSave, disabled = false }: SocialMediaEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [links, setLinks] = useState<SocialMediaLinks>(socialLinks || {})
  const [customLinks, setCustomLinks] = useState<Array<{ title: string; url: string; }>>(
    socialLinks?.customLinks || []
  )
  const { toast } = useToast()

  // Update local state when socialLinks prop changes
  useEffect(() => {
    setLinks(socialLinks || {})
    setCustomLinks(socialLinks?.customLinks || [])
  }, [socialLinks])

  const handleSave = () => {
    // Validate all URLs before saving
    const validatedLinks: SocialMediaLinks = {};

    // Only add non-empty links
    Object.entries(links).forEach(([key, value]) => {
      if (key !== 'customLinks' && value && typeof value === 'string' && value.trim()) {
        validatedLinks[key as keyof Omit<SocialMediaLinks, 'customLinks'>] = validateUrl(value.trim());
      }
    });

    // Add non-empty custom links
    const validCustomLinks = customLinks
      .filter(link => link.title && link.url)
      .map(link => ({
        title: link.title.trim(),
        url: validateUrl(link.url.trim())
      }));

    if (validCustomLinks.length > 0) {
      validatedLinks.customLinks = validCustomLinks;
    }

    // Only save if we have any valid links
    if (Object.keys(validatedLinks).length > 0) {
      onSave(validatedLinks);
    } else {
      // If no valid links, save as null to clear existing links
      onSave({});
    }

    setIsOpen(false);
    toast({
      title: "Success",
      description: "Social media links updated successfully."
    });
  }

  const handleChange = (platform: keyof SocialMediaLinks, value: string) => {
    if (platform === 'customLinks') return
    setLinks(prev => ({
      ...prev,
      [platform]: value
    }))
  }

  const addCustomLink = () => {
    setCustomLinks(prev => [...prev, { title: '', url: '' }])
  }

  const updateCustomLink = (index: number, field: 'title' | 'url', value: string) => {
    setCustomLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    ))
  }

  const removeCustomLink = (index: number) => {
    setCustomLinks(prev => prev.filter((_, i) => i !== index))
  }

  const validateUrl = (url: string): string => {
    if (!url) return ""
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
          className={`rounded-full ${links.facebook ? "bg-blue-100 hover:bg-blue-200" : ""}`}
          asChild={!!links.facebook}
          onClick={() => !links.facebook && !disabled && setIsOpen(true)}
          disabled={disabled}
        >
          {links.facebook ? (
            <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook Profile">
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
          className={`rounded-full ${links.twitter ? "bg-sky-100 hover:bg-sky-200" : ""}`}
          asChild={!!links.twitter}
          onClick={() => !links.twitter && !disabled && setIsOpen(true)}
          disabled={disabled}
        >
          {links.twitter ? (
            <a href={links.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter Profile">
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
          className={`rounded-full ${links.linkedin ? "bg-blue-100 hover:bg-blue-200" : ""}`}
          asChild={!!links.linkedin}
          onClick={() => !links.linkedin && !disabled && setIsOpen(true)}
          disabled={disabled}
        >
          {links.linkedin ? (
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile">
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
          className={`rounded-full ${links.instagram ? "bg-pink-100 hover:bg-pink-200" : ""}`}
          asChild={!!links.instagram}
          onClick={() => !links.instagram && !disabled && setIsOpen(true)}
          disabled={disabled}
        >
          {links.instagram ? (
            <a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram Profile">
              <Instagram className="h-5 w-5 text-pink-600" />
              <span className="sr-only">Instagram</span>
            </a>
          ) : (
            <Instagram className="h-5 w-5" />
          )}
        </Button>

        {/* YouTube */}
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${links.youtube ? "bg-red-100 hover:bg-red-200" : ""}`}
          asChild={!!links.youtube}
          onClick={() => !links.youtube && !disabled && setIsOpen(true)}
          disabled={disabled}
        >
          {links.youtube ? (
            <a href={links.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube Channel">
              <Youtube className="h-5 w-5 text-red-600" />
              <span className="sr-only">YouTube</span>
            </a>
          ) : (
            <Youtube className="h-5 w-5" />
          )}
        </Button>

        {/* Edit button */}
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" disabled={disabled}>
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

          <div className="space-y-2">
            <Label htmlFor="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" /> YouTube
            </Label>
            <Input
              id="youtube"
              value={links.youtube || ""}
              onChange={(e) => handleChange("youtube", e.target.value)}
              placeholder="https://youtube.com/c/yourchannel"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Custom Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomLink}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            {customLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Title"
                  value={link.title}
                  onChange={(e) => updateCustomLink(index, 'title', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomLink(index)}
                  className="h-10 w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
