import { ApiClient } from "./api-client"
import { generateId } from "./uuid"

export type MeetingRequestStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface MeetingRequest {
  id: string
  requesterId: string
  targetUserId: string
  requesterName?: string
  targetUserName?: string
  subject: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'scheduled'
  proposedDate?: string
  scheduledDate?: string
  createdAt: string
  updatedAt: string
}

const apiClient = new ApiClient()

// Transform snake_case to camelCase
function transformMeetingRequest(request: any): MeetingRequest {
  return {
    id: request.id,
    requesterId: request.requester_id,
    subject: request.subject,
    description: request.description,
    status: request.status,
    proposedDate: request.proposed_date,
    scheduledDate: request.scheduled_date,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  }
}

// Load meeting requests for a user
export async function getMeetingRequestsForUser(userId: string | number, type: 'owner' | 'requester'): Promise<MeetingRequest[]> {
  try {
    const response = await apiClient.getMeetingRequests(type)
    if (response.success && response.data?.requests) {
      return response.data.requests.map(transformApiRequestToMeetingRequest)
    }
    return []
  } catch (error) {
    console.error("Error loading meeting requests:", error)
    return []
  }
}

function transformApiRequestToMeetingRequest(apiRequest: any): MeetingRequest {
  return {
    id: Number(apiRequest.id),
    requesterId: Number(apiRequest.requester_id),
    targetUserId: Number(apiRequest.target_user_id),
    requesterName: apiRequest.requester_name,
    targetUserName: apiRequest.target_user_name,
    subject: apiRequest.subject || '',
    description: apiRequest.description || '',
    status: apiRequest.status || 'pending',
    proposedDate: apiRequest.proposed_date,
    scheduledDate: apiRequest.scheduled_date,
    createdAt: apiRequest.created_at || new Date().toISOString(),
    updatedAt: apiRequest.updated_at || new Date().toISOString(),
  }
}

// Get a meeting request by ID
export async function getMeetingRequestById(requestId: string): Promise<MeetingRequest | null> {
  try {
    const response = await apiClient.get(`/calendar/meetings/requests/${requestId}`)
    if (!response.success) {
      return null
    }
    return transformApiRequestToMeetingRequest(response.data.request)
  } catch (error) {
    console.error("Error getting meeting request by ID:", error)
    return null
  }
}

// Create a meeting request
export async function createMeetingRequest(data: {
  targetUserId: string
  subject: string
  description?: string
  proposedDate?: string
}): Promise<MeetingRequest | null> {
  try {
    const requestData = {
      target_user_id: data.targetUserId,
      subject: data.subject,
      description: data.description,
      proposed_date: data.proposedDate,
    }
    const response = await apiClient.createMeetingRequest(requestData)
    if (response.success && response.data?.request) {
      return transformApiRequestToMeetingRequest(response.data.request)
    } else {
      throw new Error(response.message || 'Failed to create meeting request')
    }
  } catch (error) {
    console.error("Error creating meeting request:", error)
    return null
  }
}

// Update a meeting request
export async function updateMeetingRequest(
  id: string,
  updates: {
    status?: 'pending' | 'approved' | 'rejected' | 'scheduled'
    scheduledDate?: string
  }
): Promise<MeetingRequest | null> {
  try {
    const response = await apiClient.updateMeetingRequest(id, updates)
    if (response.success && response.data?.request) {
      return transformApiRequestToMeetingRequest(response.data.request)
    }
    return null
  } catch (error) {
    console.error("Error updating meeting request:", error)
    return null
  }
}

// Delete a meeting request
export async function deleteMeetingRequest(id: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteMeetingRequest(id)
    return response.success
  } catch (error) {
    console.error("Error deleting meeting request:", error)
    return false
  }
}

// Check for scheduling conflicts
export async function checkSchedulingConflicts(
  userId: string,
  proposedDateTime: string,
  durationMinutes = 60,
  excludeRequestId?: string,
): Promise<boolean> {
  try {
    const response = await apiClient.get(
      `/calendar/meetings/conflicts?userId=${userId}&proposedDateTime=${proposedDateTime}&durationMinutes=${durationMinutes}${
        excludeRequestId ? `&excludeRequestId=${excludeRequestId}` : ""
      }`
    )
    return response.data?.hasConflicts || false
  } catch (error) {
    console.error("Error checking scheduling conflicts:", error)
    return false
  }
}
