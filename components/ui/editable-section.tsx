"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Pencil, Check, X } from "lucide-react"
import { useEditMode } from "@/components/edit-mode-context"

interface EditableSectionProps {
  id: string
  title?: string
  children: ReactNode
  editForm: ReactNode
  onSave?: () => void
}

export function EditableSection({ id, title, children, editForm, onSave }: EditableSectionProps) {
  const { isEditing, setIsEditing, editableSection, setEditableSection } = useEditMode()
  const [localContent, setLocalContent] = useState<ReactNode>(children)

  const isCurrentlyEditing = isEditing && editableSection === id

  const handleEdit = () => {
    setIsEditing(true)
    setEditableSection(id)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditableSection(null)
  }

  const handleSave = () => {
    setIsEditing(false)
    setEditableSection(null)
    if (onSave) onSave()
  }

  return (
    <Card className="relative border border-border/50 bg-card/80 backdrop-blur-sm">
      {title && (
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {isCurrentlyEditing ? (
          <div className="space-y-4">
            {editForm}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {localContent}
            <Button variant="outline" size="sm" className="absolute right-4 top-4" onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
