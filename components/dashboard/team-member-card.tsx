"use client"

import type { User } from "@/lib/auth-context"
import { useDisplayTitle } from "@/lib/display-title-context"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Mail,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Briefcase,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  AlertTriangle,
} from "lucide-react"
import { useState, type ReactNode, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeamMemberDetails } from "@/components/dashboard/team-member-details"
import { loadData } from "@/lib/data-persistence"
import { getStrikeStatus } from "@/lib/strikes-system"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { getInitials, normalizeAvatarUrl, isValidAvatarUrl } from "@/lib/utils"

interface TeamMemberCardProps {
  user: User
  showContactInfo: boolean
  onToggleVisibility: () => void
  actionButton?: ReactNode
  roleColor?: string
  roleIcon?: string
}

export function TeamMemberCard({
  user,
  showContactInfo,
  onToggleVisibility,
  actionButton,
  roleColor = "bg-primary-100 dark:bg-primary-900/40",
  roleIcon = "",
}: TeamMemberCardProps) {
  const { getDisplayTitle } = useDisplayTitle()
  const [imageError, setImageError] = useState(false)
  const [showFullBio, setShowFullBio] = useState(false)
  const [key, setKey] = useState(Date.now())
  const [showDetails, setShowDetails] = useState(false)
  const strikeStatus = getStrikeStatus(user.id)

  // Normalize avatar URL
  const avatarUrl = normalizeAvatarUrl(user.avatar || (user as any).avatar_url)
  const hasValidAvatar = isValidAvatarUrl(avatarUrl)

  // Debug avatar data
  console.log(`TeamMemberCard ${user.name}:`, {
    originalAvatar: user.avatar,
    avatarUrl: (user as any).avatar_url,
    normalizedAvatar: avatarUrl,
    hasValidAvatar,
    imageError
  })

  // Reset component state when user changes
  useEffect(() => {
    setKey(Date.now())
    setImageError(false)
    setShowFullBio(false)
  }, [user.id, user.avatar, user.bio])

  // Reset image error when avatar changes
  useEffect(() => {
    if (avatarUrl !== user.avatar) {
      setImageError(false)
    }
  }, [avatarUrl, user.avatar])

  // Get client names
  const getClientNames = () => {
    if (!user.clientAccess || user.clientAccess.length === 0) return null

    return user.clientAccess
      .map((access) => access.clientId.charAt(0).toUpperCase() + access.clientId.slice(1).replace(/-/g, " "))
      .join(", ")
  }

  // Get assigned clients for this team member
  const getAssignedClients = () => {
    const clients = loadData("clients", {})
    return Object.values(clients).filter((client: any) =>
      user.clientAccess?.some((access: any) => access.clientId === client.id)
    )
  }

  // Get strikes for this team member
  const getStrikes = () => {
    return loadData("strikes", []).filter((strike: any) => strike.userId === user.id) || []
  }

  return (
    <>
      <Card
        key={key}
        className="overflow-hidden transition-all hover:shadow-md border-border/50 h-full flex flex-col w-full max-w-xs group"
      >
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setShowDetails(true)}
        >
          <div className="flex flex-col items-center p-6 pb-4">
            <Avatar className="h-20 w-20 mb-4">
              {hasValidAvatar && !imageError ? (
                <AvatarImage
                  src={avatarUrl}
                  alt={user.name}
                  onError={(e) => {
                    console.log(`Avatar load error for ${user.name}:`, avatarUrl, e)
                    setImageError(true)
                  }}
                  onLoad={() => {
                    console.log(`Avatar loaded successfully for ${user.name}:`, avatarUrl)
                  }}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              )}
            </Avatar>
            <h3 className="font-medium text-lg text-center flex items-center gap-2">
              {user.name}
              {strikeStatus.total > 0 && (
                <Badge
                  variant={strikeStatus.isCritical ? "destructive" : strikeStatus.isWarning ? "secondary" : "default"}
                  className="text-xs"
                >
                  {strikeStatus.total}
                </Badge>
              )}
            </h3>
            <div className="relative text-sm text-muted-foreground text-center">
              <span>{getDisplayTitle(user.id, user.role)}</span>
            </div>
          </div>

          <CardContent className="px-6 pb-4 pt-0 flex-grow text-center">
            {user.clientAccess && user.clientAccess.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs mb-3">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{getClientNames()}</span>
              </div>
            )}

            {user.bio && (
              <div className="mb-3 text-sm">
                <p className={cn("text-muted-foreground/90", !showFullBio && "line-clamp-2")}>
                  {user.bio}
                </p>
                {user.bio.length > 100 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullBio(!showFullBio);
                    }}
                  >
                    {showFullBio ? (
                      <>
                        Show less <ChevronUp className="ml-1 h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown className="ml-1 h-3 w-3" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {showContactInfo && (
              <div className="flex items-center justify-center gap-1.5 text-xs mb-3">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <a
                  href={`mailto:${user.email}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.email}
                </a>
              </div>
            )}

            {user.socialMedia && Object.keys(user.socialMedia).length > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3">
                {user.socialMedia.twitter && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground hover:text-primary transition-colors cursor-default">
                          <Twitter className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Twitter</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {user.socialMedia.linkedin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground hover:text-primary transition-colors cursor-default">
                          <Linkedin className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>LinkedIn</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {user.socialMedia.instagram && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground hover:text-primary transition-colors cursor-default">
                          <Instagram className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Instagram</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {user.socialMedia.facebook && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground hover:text-primary transition-colors cursor-default">
                          <Facebook className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Facebook</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {user.socialMedia.youtube && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground hover:text-primary transition-colors cursor-default">
                          <Youtube className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>YouTube</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {user.socialMedia.customLinks?.map((link, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground hover:text-primary transition-colors cursor-default">
                          <LinkIcon className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{link.title}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}

            {strikeStatus.total > 0 && (
              <div className="mt-3">
                <Alert
                  variant={strikeStatus.isCritical ? "destructive" : strikeStatus.isWarning ? "warning" : "default"}
                  className="py-2"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    {strikeStatus.isCritical
                      ? "Account under review"
                      : strikeStatus.isWarning
                        ? "Warning: At risk"
                        : "Has active strike"}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {actionButton && <div className="mt-4">{actionButton}</div>}
          </CardContent>

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <Button variant="secondary" size="sm" className="shadow-lg">
              View Details
            </Button>
          </div>
        </div>

        <CardFooter
          className="bg-muted/30 px-6 py-3 border-t border-border/30 mt-auto flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {showContactInfo ? "Contact visible" : "Contact hidden"}
            </span>
            <Switch
              checked={showContactInfo}
              onCheckedChange={onToggleVisibility}
              aria-label="Toggle contact information visibility"
              className="scale-75 data-[state=checked]:bg-primary/80"
            />
          </div>
        </CardFooter>
      </Card>

      <TeamMemberDetails
        open={showDetails}
        onOpenChange={setShowDetails}
        member={user}
        clients={getAssignedClients()}
        strikes={getStrikes()}
      />
    </>
  )
}
