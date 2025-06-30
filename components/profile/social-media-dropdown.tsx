"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, Linkedin, Instagram, Pencil, Save, Trash2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { SocialMediaLinks } from "@/lib/auth-context"

interface SocialMediaDropdownProps {
  socialLinks: SocialMediaLinks
  onSave: (links: SocialMediaLinks) => void
  className?: string
}

interface SocialPlatform {
  key: keyof SocialMediaLinks
  name: string
  icon: React.ReactNode
  placeholder: string
  color: string
}

const PLATFORMS: SocialPlatform[] = [
  {
    key: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    placeholder: "https://facebook.com/yourusername",
    color: "text-blue-600",
  },
  {
    key: "twitter",
    name: "Twitter",
    icon: <Twitter className="h-5 w-5" />,
    placeholder: "https://twitter.com/yourusername",
    color: "text-sky-500",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    placeholder: "https://linkedin.com/in/yourusername",
    color: "text-blue-700",
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    placeholder: "https://instagram.com/yourusername",
    color: "text-pink-600",
  },
]

export function SocialMediaDropdown({ socialLinks, onSave, className = "" }: SocialMediaDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [links, setLinks] = useState<SocialMediaLinks>(socialLinks || {})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    // Validate all URLs before saving
    const validatedLinks = Object.fromEntries(
      Object.entries(links).map(([key, value]) => [key, validateUrl(value || "")]),
    ) as SocialMediaLinks

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

  const handleClear = (platform: keyof SocialMediaLinks) => {
    setLinks((prev) => ({
      ...prev,
      [platform]: "",
    }))
  }

  const validateUrl = (url: string): string => {
    if (!url) return ""

    // Add https:// if missing
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }

    return url
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Social Media Icons */}
      <div className="flex items-center gap-3">
        {PLATFORMS.map((platform) => (
          <Button
            key={platform.key}
            variant="outline"
            size="icon"
            className={`rounded-full ${links[platform.key] ? "bg-opacity-20 hover:bg-opacity-30" : "opacity-60"}`}
            style={{
              backgroundColor: links[platform.key] ? `rgba(59, 130, 246, 0.1)` : undefined,
            }}
            asChild={!!links[platform.key]}
          >
            {links[platform.key] ? (
              <a
                href={links[platform.key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${platform.name} Profile`}
              >
                <span className={platform.color}>{platform.icon}</span>
              </a>
            ) : (
              <span>{platform.icon}</span>
            )}
          </Button>
        ))}

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Edit social media links"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Edit Social Media Links</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {PLATFORMS.map((platform) => (
                <div key={platform.key} className="flex items-center gap-3">
                  <span className={`${platform.color} flex-shrink-0`}>{platform.icon}</span>
                  <div className="flex-1">
                    <label htmlFor={`social-${platform.key}`} className="mb-1 block text-sm font-medium">
                      {platform.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`social-${platform.key}`}
                        value={links[platform.key] || ""}
                        onChange={(e) => handleChange(platform.key, e.target.value)}
                        placeholder={platform.placeholder}
                        className="flex-1"
                      />
                      {links[platform.key] && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => handleClear(platform.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
