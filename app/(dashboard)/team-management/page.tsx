"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function TeamManagementRedirect() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Redirect to owner panel with a toast notification
    toast({
      title: "Page Moved",
      description: "Team Management has been moved to the Owner Panel.",
    })

    if (user?.role === "owner") {
      router.push("/owner-panel?tab=team-members")
    } else {
      router.push("/dashboard")
    }
  }, [router, toast, user])

  return null
}
