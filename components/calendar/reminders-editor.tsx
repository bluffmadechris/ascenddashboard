"use client"
import { Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export type Reminder = {
  id: string
  type: "email" | "notification"
  time: number
  unit: "minutes" | "hours" | "days"
}

interface RemindersEditorProps {
  reminders: Reminder[]
  onChange: (reminders: Reminder[]) => void
}

export function RemindersEditor({ reminders, onChange }: RemindersEditorProps) {
  const addReminder = () => {
    const newReminder: Reminder = {
      id: Math.random().toString(36).substring(2, 9),
      type: "notification",
      time: 15,
      unit: "minutes",
    }
    onChange([...reminders, newReminder])
  }

  const removeReminder = (id: string) => {
    onChange(reminders.filter((reminder) => reminder.id !== id))
  }

  const updateReminder = (id: string, field: keyof Reminder, value: any) => {
    onChange(
      reminders.map((reminder) => {
        if (reminder.id === id) {
          return { ...reminder, [field]: value }
        }
        return reminder
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Reminders</Label>
        <Button variant="outline" size="sm" onClick={addReminder}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reminders set</p>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-2">
              <Select value={reminder.type} onValueChange={(value) => updateReminder(reminder.id, "type", value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                max="999"
                className="w-20"
                value={reminder.time}
                onChange={(e) => updateReminder(reminder.id, "time", Number.parseInt(e.target.value) || 1)}
              />

              <Select value={reminder.unit} onValueChange={(value) => updateReminder(reminder.id, "unit", value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeReminder(reminder.id)}
                className="text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
