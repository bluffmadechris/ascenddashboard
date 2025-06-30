"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type EditModeContextType = {
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  editableSection: string | null
  setEditableSection: (section: string | null) => void
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editableSection, setEditableSection] = useState<string | null>(null)

  return (
    <EditModeContext.Provider value={{ isEditing, setIsEditing, editableSection, setEditableSection }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  const context = useContext(EditModeContext)
  if (context === undefined) {
    throw new Error("useEditMode must be used within an EditModeProvider")
  }
  return context
}
