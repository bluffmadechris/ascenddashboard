"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { loadUserAvailability, type DateAvailability } from "@/lib/calendar-utils"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"
import { Select } from "../ui/select"
import { AvailabilityCalendar } from "./availability-calendar"
import { toast } from "sonner"

export function AvailabilityView() {
  const { user } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || "")
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([])
  const [availability, setAvailability] = useState<any>(null)

  // Fetch team members if user is owner
  useEffect(() => {
    if (user?.role === 'owner') {
      const fetchTeamMembers = async () => {
        try {
          const response = await api.get('/users/team-members')
          setTeamMembers(response.data)
        } catch (error) {
          toast.error("Failed to fetch team members")
        }
      }
      fetchTeamMembers()
    }
  }, [user])

  // Fetch availability for selected user
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await api.get(`/users/${selectedUserId}/availability`)
        setAvailability(response.data)
      } catch (error) {
        toast.error("Failed to fetch availability")
      }
    }
    if (selectedUserId) {
      fetchAvailability()
    }
  }, [selectedUserId])

  return (
    <div className="space-y-4">
      {user?.role === 'owner' && (
        <div>
          <label className="block text-sm font-medium mb-1">Select Team Member</label>
          <Select
            value={selectedUserId}
            onValueChange={(value) => setSelectedUserId(value)}
          >
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {availability && (
        <AvailabilityCalendar
          availability={availability}
          userId={selectedUserId}
          isEditable={user?.id === selectedUserId}
        />
      )}
    </div>
  )
}
