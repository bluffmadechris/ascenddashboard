"use client"

import { useAuth } from "@/lib/auth-context"

export function useUser() {
  const { user } = useAuth()
  return { user }
}
