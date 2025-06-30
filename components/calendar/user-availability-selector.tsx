"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserAvailabilitySelectorProps {
  selectedUsers: string[]
  onSelectUsers: (userIds: string[]) => void
  className?: string
}

export function UserAvailabilitySelector({ selectedUsers, onSelectUsers, className }: UserAvailabilitySelectorProps) {
  const { users } = useAuth()
  const [open, setOpen] = useState(false)

  // Toggle user selection
  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      onSelectUsers([...selectedUsers, userId])
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <div className="flex items-center gap-2 truncate">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedUsers.length === 0
                  ? "Select users to view availability"
                  : `${selectedUsers.length} user${selectedUsers.length === 1 ? "" : "s"} selected`}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-64">
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => toggleUser(user.id)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedUsers.includes(user.id)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {user.role}
                      </Badge>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedUsers.map((userId) => {
            const user = users.find((u) => u.id === userId)
            if (!user) return null

            return (
              <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                <Avatar className="h-4 w-4 mr-1">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                {user.name}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => toggleUser(userId)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {user.name}</span>
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
