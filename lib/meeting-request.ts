import { loadData, saveData } from "./data-persistence"
import { generateId } from "./uuid"

export type MeetingRequestStatus = "pending" | "approved" | "scheduled" | "denied"

export interface MeetingRequest {
  id: string
  requesterId: string
  requesterName: string
  ownerId: string
  ownerName: string
  subject: string
  description: string
  preferredDates: string[] // ISO date strings
  status: MeetingRequestStatus
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  scheduledDate?: string // ISO date string (only if status is "scheduled")
  responseMessage?: string // Message from owner when responding
}

// Load meeting requests
export function loadMeetingRequests(): MeetingRequest[] {
  try {
    const data = loadData("meeting-requests", [])
    // Ensure the data is an array
    if (!Array.isArray(data)) {
      console.warn("Meeting requests data is not an array, returning empty array instead")
      return []
    }
    return data
  } catch (error) {
    console.error("Error loading meeting requests:", error)
    return []
  }
}

// Save meeting requests
export function saveMeetingRequests(requests: MeetingRequest[]): void {
  try {
    // Ensure we're saving an array
    if (!Array.isArray(requests)) {
      console.error("Attempted to save non-array meeting requests data")
      return
    }
    saveData("meeting-requests", requests)
  } catch (error) {
    console.error("Error saving meeting requests:", error)
  }
}

// Create a new meeting request
export function createMeetingRequest(request: Omit<MeetingRequest, "id" | "createdAt" | "updatedAt">): MeetingRequest {
  try {
    const now = new Date().toISOString()
    const newRequest: MeetingRequest = {
      id: generateId(),
      ...request,
      createdAt: now,
      updatedAt: now,
    }

    // Get existing requests, ensuring it's an array
    let requests = loadMeetingRequests()

    // Double-check that requests is an array
    if (!Array.isArray(requests)) {
      console.warn("Meeting requests is not an array, initializing as empty array")
      requests = []
    }

    // Add the new request
    requests.push(newRequest)

    // Save the updated requests
    saveMeetingRequests(requests)

    return newRequest
  } catch (error) {
    console.error("Error creating meeting request:", error)
    throw new Error(`Failed to create meeting request: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Update a meeting request
export function updateMeetingRequest(
  requestId: string,
  updates: Partial<Omit<MeetingRequest, "id" | "createdAt">>,
): MeetingRequest | null {
  try {
    const requests = loadMeetingRequests()

    // Ensure requests is an array
    if (!Array.isArray(requests)) {
      console.error("Meeting requests is not an array when updating")
      return null
    }

    const index = requests.findIndex((r) => r.id === requestId)

    if (index === -1) return null

    const updatedRequest: MeetingRequest = {
      ...requests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    requests[index] = updatedRequest
    saveMeetingRequests(requests)

    return updatedRequest
  } catch (error) {
    console.error("Error updating meeting request:", error)
    return null
  }
}

// Get meeting requests for a user (either as requester or owner)
export function getMeetingRequestsForUser(userId: string, role: "requester" | "owner"): MeetingRequest[] {
  try {
    const requests = loadMeetingRequests()

    // Ensure requests is an array
    if (!Array.isArray(requests)) {
      console.error("Meeting requests is not an array when getting user requests")
      return []
    }

    return requests.filter((r) => (role === "requester" ? r.requesterId === userId : r.ownerId === userId))
  } catch (error) {
    console.error("Error getting meeting requests for user:", error)
    return []
  }
}

// Get a meeting request by ID
export function getMeetingRequestById(requestId: string): MeetingRequest | null {
  try {
    const requests = loadMeetingRequests()

    // Ensure requests is an array
    if (!Array.isArray(requests)) {
      console.error("Meeting requests is not an array when getting by ID")
      return null
    }

    return requests.find((r) => r.id === requestId) || null
  } catch (error) {
    console.error("Error getting meeting request by ID:", error)
    return null
  }
}

// Delete a meeting request
export function deleteMeetingRequest(requestId: string): boolean {
  try {
    const requests = loadMeetingRequests()

    // Ensure requests is an array
    if (!Array.isArray(requests)) {
      console.error("Meeting requests is not an array when deleting")
      return false
    }

    const filteredRequests = requests.filter((r) => r.id !== requestId)

    if (filteredRequests.length === requests.length) return false

    saveMeetingRequests(filteredRequests)
    return true
  } catch (error) {
    console.error("Error deleting meeting request:", error)
    return false
  }
}

// Check for scheduling conflicts
export function checkSchedulingConflicts(
  userId: string,
  proposedDate: string,
  durationMinutes = 60,
  excludeRequestId?: string,
): boolean {
  try {
    const requests = loadMeetingRequests()

    if (!Array.isArray(requests)) {
      console.error("Meeting requests is not an array when checking conflicts")
      return false
    }

    const proposedStart = new Date(proposedDate)
    const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60000)

    // Find any scheduled meetings that overlap with the proposed time
    const conflictingMeetings = requests.filter((req) => {
      // Skip the current request if we're rescheduling
      if (excludeRequestId && req.id === excludeRequestId) return false

      // Only check scheduled meetings
      if (req.status !== "scheduled" || !req.scheduledDate) return false

      // Check if this meeting involves the user
      if (req.requesterId !== userId && req.ownerId !== userId) return false

      const meetingStart = new Date(req.scheduledDate)
      const meetingEnd = new Date(meetingStart.getTime() + durationMinutes * 60000)

      // Check for overlap
      return (
        (proposedStart >= meetingStart && proposedStart < meetingEnd) || // Proposed start during existing meeting
        (proposedEnd > meetingStart && proposedEnd <= meetingEnd) || // Proposed end during existing meeting
        (proposedStart <= meetingStart && proposedEnd >= meetingEnd) // Proposed meeting encompasses existing meeting
      )
    })

    return conflictingMeetings.length > 0
  } catch (error) {
    console.error("Error checking scheduling conflicts:", error)
    return false
  }
}
