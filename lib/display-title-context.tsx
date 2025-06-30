"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { loadData, saveData } from "@/lib/data-persistence"

type DisplayTitlesMap = Record<string, string>

interface DisplayTitleContextType {
  getDisplayTitle: (userId: string, defaultTitle: string) => string
  updateDisplayTitle: (userId: string, title: string) => void
  refreshTitles: () => void
}

const DisplayTitleContext = createContext<DisplayTitleContextType | undefined>(undefined)

export function DisplayTitleProvider({ children }: { children: React.ReactNode }) {
  const [displayTitles, setDisplayTitles] = useState<DisplayTitlesMap>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Load display titles from localStorage on mount only
  useEffect(() => {
    const savedTitles = loadData("displayTitles", {})
    setDisplayTitles(savedTitles || {})
    setIsInitialized(true)
  }, [])

  // Get display title for a user - memoized to prevent re-renders
  const getDisplayTitle = useCallback(
    (userId: string, defaultTitle: string): string => {
      return displayTitles[userId] || defaultTitle
    },
    [displayTitles],
  )

  // Update display title for a user
  const updateDisplayTitle = useCallback((userId: string, title: string) => {
    setDisplayTitles((prev) => {
      const updatedTitles = { ...prev, [userId]: title }
      saveData("displayTitles", updatedTitles)
      return updatedTitles
    })
  }, [])

  // Refresh titles from localStorage
  const refreshTitles = useCallback(() => {
    const savedTitles = loadData("displayTitles", {})
    setDisplayTitles(savedTitles || {})
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = {
    getDisplayTitle,
    updateDisplayTitle,
    refreshTitles,
  }

  // Don't render children until we've loaded the initial data
  if (!isInitialized) {
    return null
  }

  return <DisplayTitleContext.Provider value={value}>{children}</DisplayTitleContext.Provider>
}

export function useDisplayTitle() {
  const context = useContext(DisplayTitleContext)
  if (context === undefined) {
    throw new Error("useDisplayTitle must be used within a DisplayTitleProvider")
  }
  return context
}
