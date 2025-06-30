"use client"

import type { User } from "@/lib/auth-context"
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

interface TeamMemberCardProps {
  user: User
  showContactInfo: boolean
  onToggleVisibility: () => void
  actionButton?: ReactNode
  roleColor?: string
  roleIcon?: string
  displayTitle?: string
}

export function TeamMemberCard({
  user,
  showContactInfo,
  onToggleVisibility,
  actionButton,
  roleColor = "bg-primary-100 dark:bg-primary-900/40",
  roleIcon = "",
  displayTitle,
}: TeamMemberCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showFullBio, setShowFullBio] = useState(false)
  const [key, setKey] = useState(Date.now())
  const [showDetails, setShowDetails] = useState(false)
  const strikeStatus = getStrikeStatus(user.id)

  // Reset component state when user changes
  useEffect(() => {
    setKey(Date.now())
    setImageError(false)
    setShowFullBio(false)
  }, [user.id, user.avatar, user.bio])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

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
        className="overflow-hidden transition-all hover:shadow-md border-border/50 h-full flex flex-col w-full max-w-xs cursor-pointer group"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex flex-col items-center p-6 pb-4">
          <Avatar className="h-20 w-20 mb-4">
            {user.avatar && !imageError ? (
              <AvatarImage
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                onError={() => setImageError(true)}
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
          <p className="text-sm text-muted-foreground text-center">{displayTitle || user.role}</p>
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

        <CardFooter className="bg-muted/30 px-6 py-3 border-t border-border/30 mt-auto flex justify-center">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {showContactInfo ? "Contact visible" : "Contact hidden"}
            </span>
            <Switch
              checked={showContactInfo}
              onCheckedChange={(checked) => {
                onToggleVisibility()
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Toggle contact information visibility"
              className="scale-75 data-[state=checked]:bg-primary/80"
            />
          </div>
        </CardFooter>

        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" size="sm" className="shadow-lg">
            View Details
          </Button>
        </div>
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
