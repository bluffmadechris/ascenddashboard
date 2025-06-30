"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

export function UserNav() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Get user initials for the avatar
  const getInitials = () => {
    if (!user?.name) return "U"
    const names = user.name.split(" ")
    if (names.length === 1) return names[0].charAt(0)
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`
  }

  const handleLogout = () => {
    setMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
  }

  return (
    <div className="relative flex items-center gap-2">
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
          <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
        </Avatar>
        <span className="font-medium hidden md:inline-block">{user?.name?.split(" ")[0] || "User"}</span>
      </Button>

      {/* Simple dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border z-50">
          <div className="py-1 rounded-md bg-card shadow-xs">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
            </div>

            <Link
              href="/profile"
              className="block px-4 py-2 text-sm hover:bg-accent"
              onClick={() => setMenuOpen(false)}
            >
              Edit Profile
            </Link>

            <Link
              href="/settings"
              className="block px-4 py-2 text-sm hover:bg-accent"
              onClick={() => setMenuOpen(false)}
            >
              Account Settings
            </Link>

            <div className="border-t border-border">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>Are you sure you want to sign out of your account?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click outside to close menu */}
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
