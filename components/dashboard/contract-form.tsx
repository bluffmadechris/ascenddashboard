"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isBefore } from "date-fns"
import { Upload, AlertCircle, CalendarIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { loadData, saveData } from "@/lib/data-persistence"
import { generateId } from "@/lib/uuid"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Define contract type
export type Contract = {
  id: string
  name: string
  status: "Active" | "Pending" | "Expired" | "Draft"
  startDate: string // Stored in yyyy-MM-dd format
  endDate: string // Stored in yyyy-MM-dd format
  description?: string
  assignedTo?: string
  fileUrl?: string
  fileName?: string
  createdBy: string
  createdAt: string
}

type ContractFormProps = {
  onSuccess: () => void
  initialData?: Partial<Contract>
  isEditing?: boolean
}

export function ContractForm({ onSuccess, initialData, isEditing = false }: ContractFormProps) {
  const { user, users, getAvailableClients } = useAuth()
  const clients = getAvailableClients()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.startDate ? new Date(initialData.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endDate ? new Date(initialData.endDate) : undefined,
  )
  const [dateError, setDateError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<Partial<Contract>>({
    name: initialData?.name || "",
    status: initialData?.status || "Draft",
    description: initialData?.description || "",
    assignedTo: initialData?.assignedTo || "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  // Validate dates whenever they change
  useEffect(() => {
    validateDates()
  }, [startDate, endDate])

  // Function to validate dates
  const validateDates = () => {
    setDateError(null)

    // If both dates are set, validate that end date is after start date
    if (startDate && endDate) {
      if (isBefore(endDate, startDate)) {
        setDateError("End date cannot be earlier than start date")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate dates before submission
    if (!validateDates()) {
      toast({
        title: "Invalid dates",
        description: dateError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, we would upload the file to a server or cloud storage
      // For this demo, we'll just store the file name
      const fileUrl = file ? URL.createObjectURL(file) : initialData?.fileUrl
      const fileName = file ? file.name : initialData?.fileName

      // Create contract object
      const contractData: Contract = {
        id: initialData?.id || generateId(),
        name: formData.name || "Untitled Contract",
        status: (formData.status as Contract["status"]) || "Draft",
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
        description: formData.description,
        assignedTo: formData.assignedTo,
        fileUrl,
        fileName,
        createdBy: initialData?.createdBy || user.id,
        createdAt: initialData?.createdAt || new Date().toISOString(),
      }

      // Save contract to localStorage
      const existingContracts: Contract[] = loadData("contracts", [])

      let updatedContracts: Contract[]

      if (isEditing) {
        // Update existing contract
        updatedContracts = existingContracts.map((c) => (c.id === contractData.id ? contractData : c))
      } else {
        // Add new contract
        updatedContracts = [...existingContracts, contractData]
      }

      saveData("contracts", updatedContracts)

      // Call success callback
      onSuccess()

      // Show success toast
      toast({
        title: isEditing ? "Contract updated" : "Contract created",
        description: `${contractData.name} has been ${isEditing ? "updated" : "created"} successfully.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving contract:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the contract. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Contract Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Website Development Agreement"
            required
          />
        </div>

        <div>
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Select value={formData.assignedTo} onValueChange={(value) => handleSelectChange("assignedTo", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange("status", value as Contract["status"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM d, yyyy") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM d, yyyy") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => startDate ? isBefore(date, startDate) : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {dateError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dateError}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the contract"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="file">Upload Contract Document</Label>
          <div className="mt-1 flex items-center">
            <Label
              htmlFor="file"
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-background px-6 py-4 text-center"
            >
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                {file ? file.name : initialData?.fileName || "Click to upload or drag and drop"}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">PDF, DOCX, or TXT up to 10MB</div>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
              />
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !!dateError}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Contract" : "Create Contract"}
        </Button>
      </div>
    </form>
  )
}
