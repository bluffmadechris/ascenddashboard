"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EditLinks } from "./edit-links"
import { Facebook, Twitter, Linkedin, Instagram, Globe, Github, Youtube, Twitch, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface LinkItem {
  id: string
  title: string
  url: string
  icon: string
}

interface ProfileLinksProps {
  initialLinks?: LinkItem[]
  editable?: boolean
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

export function ProfileLinks({ initialLinks = [], editable = false }: ProfileLinksProps) {
  const [links, setLinks] = useState<LinkItem[]>(initialLinks)
  const { toast } = useToast()

  const handleSaveLinks = (updatedLinks: LinkItem[]) => {
    setLinks(updatedLinks)
    // Here you would typically save to your backend
    toast({
      title: "Links updated",
      description: "Your profile links have been updated successfully.",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Links</h3>
        {editable && <EditLinks initialLinks={links} onSave={handleSaveLinks} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No links added yet.</p>
        ) : (
          links.map((link) => (
            <Button key={link.id} variant="outline" size="sm" className="rounded-full" asChild>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                {ICON_MAP[link.icon] || <ExternalLink className="h-4 w-4" />}
                <span>{link.title}</span>
              </a>
            </Button>
          ))
        )}
      </div>
    </div>
  )
}
