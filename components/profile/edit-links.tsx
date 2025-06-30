"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Github,
  Youtube,
  Twitch,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"

interface LinkItem {
  id: string
  title: string
  url: string
  icon: string
}

interface EditLinksProps {
  initialLinks?: LinkItem[]
  onSave: (links: LinkItem[]) => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  github: <Github className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  twitch: <Twitch className="h-5 w-5" />,
  website: <Globe className="h-5 w-5" />,
  other: <ExternalLink className="h-5 w-5" />,
}

export function EditLinks({ initialLinks = [], onSave }: EditLinksProps) {
  const [links, setLinks] = useState<LinkItem[]>(initialLinks)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleAddLink = () => {
    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      title: "",
      url: "",
      icon: "website",
    }
    setLinks([...links, newLink])
  }

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id))
  }

  const handleLinkChange = (id: string, field: keyof LinkItem, value: string) => {
    setLinks(links.map((link) => (link.id === id ? { ...link, [field]: value } : link)))
  }

  const handleSave = () => {
    // Validate URLs
    const validatedLinks = links.map((link) => ({
      ...link,
      url: validateUrl(link.url),
    }))

    onSave(validatedLinks)
    setIsOpen(false)
    toast({
      title: "Links updated",
      description: "Your profile links have been updated successfully.",
    })
  }

  const validateUrl = (url: string): string => {
    if (!url) return url
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="linkEditor" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Edit Links
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {links.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No links added yet. Add your first link below.</div>
          ) : (
            links.map((link) => (
              <Card key={link.id} className="border">
                <CardContent className="pt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
                      <div className="space-y-2">
                        <Label htmlFor={`link-title-${link.id}`}>Link Title</Label>
                        <Input
                          id={`link-title-${link.id}`}
                          value={link.title}
                          onChange={(e) => handleLinkChange(link.id, "title", e.target.value)}
                          placeholder="My Website"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="self-end text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove link</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`link-url-${link.id}`}>URL</Label>
                      <Input
                        id={`link-url-${link.id}`}
                        value={link.url}
                        onChange={(e) => handleLinkChange(link.id, "url", e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`link-icon-${link.id}`}>Icon</Label>
                      <select
                        id={`link-icon-${link.id}`}
                        value={link.icon}
                        onChange={(e) => handleLinkChange(link.id, "icon", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="website">Website</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                        <option value="github">GitHub</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitch">Twitch</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleAddLink}>
            <Plus className="h-4 w-4" />
            Add New Link
          </Button>
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
