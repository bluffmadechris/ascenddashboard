"use client"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface RecurrenceEditorProps {
  recurrence?: {
    frequency: string
    interval: number
    ends: string
    count: number
    until: Date
    weekdays: {
      monday: boolean
      tuesday: boolean
      wednesday: boolean
      thursday: boolean
      friday: boolean
      saturday: boolean
      sunday: boolean
    }
  }
  onChange: (recurrence: any) => void
  startDate?: Date
}

export function RecurrenceEditor({
  recurrence = {
    frequency: "daily",
    interval: 1,
    ends: "never",
    count: 5,
    until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    weekdays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
  },
  onChange,
  startDate = new Date(),
}: RecurrenceEditorProps) {
  // Update frequency
  const handleFrequencyChange = (value: string) => {
    onChange({
      ...recurrence,
      frequency: value,
    })
  }

  // Update interval
  const handleIntervalChange = (value: string) => {
    onChange({
      ...recurrence,
      interval: Number.parseInt(value) || 1,
    })
  }

  // Update ends type
  const handleEndsChange = (value: string) => {
    onChange({
      ...recurrence,
      ends: value,
    })
  }

  // Update count
  const handleCountChange = (value: string) => {
    onChange({
      ...recurrence,
      count: Number.parseInt(value) || 1,
    })
  }

  // Update until date
  const handleUntilChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        ...recurrence,
        until: date,
      })
    }
  }

  // Update weekday
  const handleWeekdayChange = (day: keyof typeof recurrence.weekdays, checked: boolean) => {
    onChange({
      ...recurrence,
      weekdays: {
        ...recurrence.weekdays,
        [day]: checked,
      },
    })
  }

  // Get frequency label
  const getFrequencyLabel = () => {
    switch (recurrence.frequency) {
      case "daily":
        return recurrence.interval === 1 ? "day" : "days"
      case "weekly":
        return recurrence.interval === 1 ? "week" : "weeks"
      case "monthly":
        return recurrence.interval === 1 ? "month" : "months"
      case "yearly":
        return recurrence.interval === 1 ? "year" : "years"
      default:
        return "days"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={recurrence.frequency} onValueChange={handleFrequencyChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span>every</span>
          <Input
            type="number"
            min="1"
            max="99"
            className="w-16"
            value={recurrence.interval}
            onChange={(e) => handleIntervalChange(e.target.value)}
          />
          <span>{getFrequencyLabel()}</span>
        </div>
      </div>

      {recurrence.frequency === "weekly" && (
        <div className="flex flex-wrap gap-2 pl-4">
          {Object.entries(recurrence.weekdays).map(([day, isSelected]) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleWeekdayChange(day as any, !!checked)}
              />
              <Label htmlFor={`day-${day}`} className="capitalize">
                {day}
              </Label>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label>Ends</Label>
        <RadioGroup value={recurrence.ends} onValueChange={handleEndsChange} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never" id="never" />
            <Label htmlFor="never">Never</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="after" id="after" />
            <Label htmlFor="after">After</Label>
            <Input
              type="number"
              min="1"
              max="999"
              className="w-16"
              value={recurrence.count}
              onChange={(e) => handleCountChange(e.target.value)}
              disabled={recurrence.ends !== "after"}
            />
            <span>occurrences</span>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="on" id="on" />
            <Label htmlFor="on">On</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-[180px] justify-start text-left font-normal ${
                    recurrence.ends !== "on" ? "opacity-50" : ""
                  }`}
                  disabled={recurrence.ends !== "on"}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {recurrence.until ? format(recurrence.until, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={recurrence.until}
                  onSelect={handleUntilChange}
                  disabled={(date) => date < startDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
