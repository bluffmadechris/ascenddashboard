"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { loadData, saveData } from "@/lib/data-persistence"

interface EditClientDialogProps {
  client: {
    id: string
    name: string
    industry: string
    status: string
    totalSpent: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function EditClientDialog({
  client,
  open,
  onOpenChange,
  onSave,
}: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    status: client.status,
    totalSpent: client.totalSpent.replace(/[^0-9.]/g, ""),
  })

  const handleSave = () => {
    try {
      // Load existing clients
      const clients = loadData("clients", {})

      // Update the specific client
      if (clients[client.id]) {
        clients[client.id] = {
          ...clients[client.id],
          status: formData.status,
          totalSpent: formData.totalSpent.startsWith("$")
            ? formData.totalSpent
            : `$${parseFloat(formData.totalSpent).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        }

        // Save updated clients
        saveData("clients", clients)

        toast.success("Client updated successfully")
        onSave()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast.error("Failed to update client")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client status and revenue information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total Revenue</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                type="number"
                value={formData.totalSpent}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalSpent: e.target.value }))
                }
                className="pl-7"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
