import { ApiClient } from "./api-client"
import { generateId } from "./uuid"
import { format, addDays, addWeeks, addMonths, addYears, getDay, parseISO } from "date-fns"

// Create API client instance
const apiClient = new ApiClient()

// Define event types
export type EventType =
  | "default"
  | "meeting"
  | "task"
  | "reminder"
  | "out-of-office"
  | "personal"
  | "availability"
  | "unavailable"

// Define event status
export type EventStatus = "confirmed" | "tentative" | "cancelled"

// Define recurrence types
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly"

// Define recurrence end types
export type RecurrenceEndType = "never" | "after" | "on-date"

// Define reminder types
export type ReminderType = "notification" | "email"

// Define reminder times
export type ReminderTime =
  | "at-time"
  | "5-minutes"
  | "10-minutes"
  | "15-minutes"
  | "30-minutes"
  | "1-hour"
  | "2-hours"
  | "1-day"
  | "2-days"

// Define reminder
export interface Reminder {
  id: string
  type: ReminderType
  time: ReminderTime
  sent: boolean
}

// Define recurrence rule
export interface RecurrenceRule {
  type: RecurrenceType
  interval: number // Every X days/weeks/months/years
  weekdays?: number[] // 0-6, Sunday to Saturday (for weekly)
  monthDay?: number // Day of month (for monthly)
  endType: RecurrenceEndType
  endAfter?: number // Number of occurrences
  endDate?: string // ISO date string
}

// Define calendar event (updated to match API structure)
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  start: string // ISO date string
  end: string // ISO date string
  allDay: boolean
  type: EventType
  status: EventStatus
  color?: string
  createdBy: string // User ID
  attendees?: string[] // User IDs (stored as JSON in DB)
  assignedTo?: string[] // User IDs for compatibility
  recurrence?: RecurrenceRule
  reminders?: Reminder[]
  parentEventId?: string // For recurring event instances
  isRecurringInstance?: boolean
  categories?: string[]
  visibility?: "public" | "private"
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  // Additional fields from API
  client_id?: number
  client_name?: string
  client_company?: string
  created_by_name?: string
}

// Define calendar category
export interface CalendarCategory {
  id: string
  name: string
  color: string
  visible: boolean
  userId: string
}

// Define availability (still using localStorage for now as it's not in the API)
export interface Availability {
  userId: string
  dates: DateAvailability[]
  defaultStartTime: string
  defaultEndTime: string
  // New field for specific unavailable time slots
  unavailableSlots: UnavailableTimeSlot[]
}

// Define date availability
export interface DateAvailability {
  date: string
  available: boolean
  startTime: string
  endTime: string
}

// New interface for unavailable time slots
export interface UnavailableTimeSlot {
  id: string
  date: string // ISO date string for the day (YYYY-MM-DD)
  startTime: string // Time format HH:MM
  endTime: string // Time format HH:MM
  title?: string // Optional title/reason for unavailability
  recurring?: RecurrenceRule // Optional recurrence rule
}

// Load calendar events from API
export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await apiClient.getCalendarEvents()
    if (response.success && response.data?.events) {
      return response.data.events.map(transformApiEventToCalendarEvent)
    }
    return []
  } catch (error) {
    console.error("Error loading calendar events:", error)
    return []
  }
}

// Transform API event to CalendarEvent format
function transformApiEventToCalendarEvent(apiEvent: any): CalendarEvent {
  return {
    id: apiEvent.id?.toString() || generateId(),
    title: apiEvent.title || "",
    description: apiEvent.description || "",
    location: apiEvent.location || "",
    start: apiEvent.start_time || apiEvent.start || new Date().toISOString(),
    end: apiEvent.end_time || apiEvent.end || new Date().toISOString(),
    allDay: false, // API doesn't have allDay field yet
    type: "meeting" as EventType,
    status: "confirmed" as EventStatus,
    color: "#3b82f6", // Default blue color
    createdBy: apiEvent.created_by?.toString() || apiEvent.createdBy || "",
    attendees: parseAttendees(apiEvent.attendees),
    assignedTo: parseAttendees(apiEvent.attendees), // For compatibility
    createdAt: apiEvent.created_at || new Date().toISOString(),
    updatedAt: apiEvent.updated_at || new Date().toISOString(),
    client_id: apiEvent.client_id,
    client_name: apiEvent.client_name,
    client_company: apiEvent.client_company,
    created_by_name: apiEvent.created_by_name,
  }
}

// Parse attendees from API (could be JSON string or array)
function parseAttendees(attendees: any): string[] {
  if (!attendees) return []
  if (Array.isArray(attendees)) return attendees.map(String)
  if (typeof attendees === 'string') {
    try {
      const parsed = JSON.parse(attendees)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

// Transform CalendarEvent to API format
function transformCalendarEventToApi(event: CalendarEvent): any {
  return {
    title: event.title,
    description: event.description || "",
    start_time: event.start,
    end_time: event.end,
    location: event.location || "",
    attendees: JSON.stringify(event.attendees || []),
    client_id: event.client_id || null,
  }
}

// Save calendar events is not needed as we create/update individual events

// Load calendar categories (keeping localStorage for now as not in API)
export function loadCalendarCategories(): CalendarCategory[] {
  try {
    const categories = JSON.parse(localStorage.getItem("ascend-media-calendar-categories") || "[]")
    return Array.isArray(categories) ? categories : []
  } catch (error) {
    console.error("Error loading calendar categories:", error)
    return []
  }
}

// Save calendar categories (keeping localStorage for now)
export function saveCalendarCategories(categories: CalendarCategory[]): void {
  try {
    if (!Array.isArray(categories)) {
      console.error("Attempted to save non-array calendar categories")
      return
    }
    localStorage.setItem("ascend-media-calendar-categories", JSON.stringify(categories))
  } catch (error) {
    console.error("Error saving calendar categories:", error)
  }
}

// Get default availability
export function getDefaultAvailability(userId: string): Availability {
  return {
    userId,
    dates: [], // Start with empty dates array
    defaultStartTime: "09:00",
    defaultEndTime: "17:00",
    unavailableSlots: [],
  }
}

// Load user availability (keeping localStorage for now as not in API)
export function loadUserAvailability(userId: string): Availability {
  try {
    const storedAvailability = localStorage.getItem(`ascend-media-availability-${userId}`)
    if (!storedAvailability) {
      // If no stored availability, return default
      const defaultAvail = getDefaultAvailability(userId)
      saveUserAvailability(defaultAvail)
      return defaultAvail
    }

    const availability = JSON.parse(storedAvailability)
    // Add unavailableSlots array if it doesn't exist (backward compatibility)
    if (!availability.unavailableSlots) {
      availability.unavailableSlots = []
    }

    return availability as Availability
  } catch (error) {
    console.error("Error loading user availability:", error)
    // Return default availability on error
    const defaultAvail = getDefaultAvailability(userId)
    saveUserAvailability(defaultAvail)
    return defaultAvail
  }
}

// Save user availability (keeping localStorage for now)
export function saveUserAvailability(availability: Availability): void {
  try {
    if (!availability.userId) {
      console.error("Attempted to save availability without userId")
      return
    }
    localStorage.setItem(`ascend-media-availability-${availability.userId}`, JSON.stringify(availability))
  } catch (error) {
    console.error("Error saving user availability:", error)
  }
}

// Check if a date is available
export function isDateAvailable(userId: string, date: Date): boolean {
  const availability = loadUserAvailability(userId)
  const dateStr = format(date, "yyyy-MM-dd")
  const dateAvail = availability.dates.find((d) => d.date === dateStr)
  return dateAvail ? dateAvail.available : true // Default to available if no entry
}

// Toggle date availability
export function toggleDateAvailability(userId: string, date: Date): { available: boolean } {
  const availability = loadUserAvailability(userId)
  const dateStr = format(date, "yyyy-MM-dd")
  const updatedDates = [...availability.dates]
  const existingIndex = updatedDates.findIndex((d) => d.date === dateStr)

  let newAvailable: boolean

  if (existingIndex !== -1) {
    // Toggle existing date
    newAvailable = !updatedDates[existingIndex].available
    updatedDates[existingIndex] = {
      ...updatedDates[existingIndex],
      available: newAvailable,
    }
  } else {
    // Create new date entry as unavailable (since we're toggling from the default available state)
    newAvailable = false
    updatedDates.push({
      date: dateStr,
      available: newAvailable,
      startTime: availability.defaultStartTime,
      endTime: availability.defaultEndTime,
    })
  }

  // Save updated availability
  saveUserAvailability({
    ...availability,
    dates: updatedDates,
  })

  return { available: newAvailable }
}

// Create a new unavailable time slot
export function createUnavailableTimeSlot(
  userId: string,
  slot: Omit<UnavailableTimeSlot, "id">,
): UnavailableTimeSlot | null {
  try {
    const availability = loadUserAvailability(userId)
    if (!availability) return null

    const newSlot: UnavailableTimeSlot = {
      id: generateId(),
      ...slot,
    }

    availability.unavailableSlots.push(newSlot)
    saveUserAvailability(availability)

    // If this is a recurring unavailable slot, generate events for it
    if (newSlot.recurring && newSlot.recurring.type !== "none") {
      generateRecurringUnavailableSlots(userId, newSlot)
    }

    return newSlot
  } catch (error) {
    console.error("Error creating unavailable time slot:", error)
    return null
  }
}

// Delete an unavailable time slot
export function deleteUnavailableTimeSlot(userId: string, slotId: string, deleteRecurring = false): boolean {
  try {
    const availability = loadUserAvailability(userId)
    if (!availability) return false

    const slotToDelete = availability.unavailableSlots.find((s) => s.id === slotId)
    if (!slotToDelete) return false

    if (deleteRecurring && slotToDelete.recurring) {
      // Filter out all slots with matching recurring pattern
      availability.unavailableSlots = availability.unavailableSlots.filter(
        (s) => s.id !== slotId && (!s.recurring || s.recurring !== slotToDelete.recurring),
      )
    } else {
      // Just delete the specific slot
      availability.unavailableSlots = availability.unavailableSlots.filter((s) => s.id !== slotId)
    }

    saveUserAvailability(availability)
    return true
  } catch (error) {
    console.error("Error deleting unavailable time slot:", error)
    return false
  }
}

// Check if a specific time is unavailable for a user
export function isTimeUnavailable(userId: string, date: Date, startTime?: string, endTime?: string): boolean {
  try {
    // First check if the whole day is unavailable
    const availability = loadUserAvailability(userId)
    if (!availability) return false

    const dateStr = format(date, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    // If the date is explicitly marked as unavailable
    if (dateAvail && !dateAvail.available) return true

    // If no specific time is provided, we're just checking the day
    if (!startTime || !endTime) return false

    // Check against unavailable time slots
    return availability.unavailableSlots.some((slot) => {
      // Check if the date matches
      if (slot.date !== dateStr) return false

      // Check if the time ranges overlap
      const slotStart = slot.startTime
      const slotEnd = slot.endTime

      // Time ranges overlap if one range doesn't completely precede the other
      return !(endTime <= slotStart || startTime >= slotEnd)
    })
  } catch (error) {
    console.error("Error checking if time is unavailable:", error)
    return false
  }
}

// Get all unavailable time slots for a specific date
export function getUnavailableTimeSlots(userId: string, date: Date): UnavailableTimeSlot[] {
  try {
    const availability = loadUserAvailability(userId)
    if (!availability) return []

    const dateStr = format(date, "yyyy-MM-dd")
    return availability.unavailableSlots.filter((slot) => slot.date === dateStr)
  } catch (error) {
    console.error("Error getting unavailable time slots:", error)
    return []
  }
}

// Generate calendar events from unavailable time slots for display
export function getUnavailableSlotEvents(userId: string): CalendarEvent[] {
  try {
    const availability = loadUserAvailability(userId)
    if (!availability) return []

    const events: CalendarEvent[] = []
    const now = new Date().toISOString()

    availability.unavailableSlots.forEach((slot) => {
      // Create a full date-time string by combining date and time
      const startDateTime = `${slot.date}T${slot.startTime}:00`
      const endDateTime = `${slot.date}T${slot.endTime}:00`

      // Create an event for this unavailable slot
      const event: CalendarEvent = {
        id: `unavail-${slot.id}`,
        title: slot.title || "Unavailable",
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        type: "unavailable",
        status: "confirmed",
        createdBy: userId,
        color: "#ef4444", // Red color for unavailable
        createdAt: now,
        updatedAt: now,
      }

      events.push(event)
    })

    return events
  } catch (error) {
    console.error("Error getting unavailable slot events:", error)
    return []
  }
}

// Helper function to generate recurring unavailable slots
function generateRecurringUnavailableSlots(userId: string, parentSlot: UnavailableTimeSlot): void {
  if (!parentSlot.recurring || parentSlot.recurring.type === "none") return

  try {
    const availability = loadUserAvailability(userId)
    if (!availability) return

    const startDate = parseISO(`${parentSlot.date}T00:00:00`)
    const maxInstances = 52 // Limit number of generated instances
    let currentDate = new Date(startDate)

    // Determine end date for generation
    let endDate: Date | undefined
    if (parentSlot.recurring.endType === "on-date" && parentSlot.recurring.endDate) {
      endDate = parseISO(parentSlot.recurring.endDate)
    }

    // Generate instances
    for (let i = 1; i < maxInstances; i++) {
      // Skip the first instance as it's the parent
      if (parentSlot.recurring.type === "daily") {
        currentDate = addDays(currentDate, parentSlot.recurring.interval)
      } else if (parentSlot.recurring.type === "weekly") {
        currentDate = addWeeks(currentDate, parentSlot.recurring.interval)
      } else if (parentSlot.recurring.type === "monthly") {
        currentDate = addMonths(currentDate, parentSlot.recurring.interval)
      } else if (parentSlot.recurring.type === "yearly") {
        currentDate = addYears(currentDate, parentSlot.recurring.interval)
      }

      // Check if we've reached the end
      if (endDate && currentDate > endDate) break
      if (parentSlot.recurring.endType === "after" && i >= parentSlot.recurring.endAfter!) break

      // Create a new slot for this instance
      const newSlot: UnavailableTimeSlot = {
        id: generateId(),
        date: format(currentDate, "yyyy-MM-dd"),
        startTime: parentSlot.startTime,
        endTime: parentSlot.endTime,
        title: parentSlot.title,
        recurring: parentSlot.recurring,
      }

      availability.unavailableSlots.push(newSlot)
    }

    saveUserAvailability(availability)
  } catch (error) {
    console.error("Error generating recurring unavailable slots:", error)
  }
}

// Create a new calendar event using API
export async function createCalendarEvent(event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): Promise<CalendarEvent> {
  try {
    const apiEvent = transformCalendarEventToApi(event)
    const response = await apiClient.createCalendarEvent(apiEvent)
    
    if (response.success && response.data?.event) {
      return transformApiEventToCalendarEvent(response.data.event)
    } else {
      throw new Error(response.message || "Failed to create calendar event")
    }
  } catch (error) {
    console.error("Error creating calendar event:", error)
    throw error
  }
}

// Update a calendar event using API
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEvent>,
  updateRecurring = false,
): Promise<CalendarEvent | null> {
  try {
    const apiUpdates = transformCalendarEventToApi(updates as CalendarEvent)
    const response = await apiClient.updateCalendarEvent(parseInt(eventId), apiUpdates)
    
    if (response.success && response.data?.event) {
      return transformApiEventToCalendarEvent(response.data.event)
    } else {
      console.error("Failed to update calendar event:", response.message)
      return null
    }
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return null
  }
}

// Delete a calendar event using API
export async function deleteCalendarEvent(eventId: string, deleteRecurring = false): Promise<boolean> {
  try {
    const response = await apiClient.deleteCalendarEvent(parseInt(eventId))
    
    if (response.success) {
      return true
    } else {
      console.error("Failed to delete calendar event:", response.message)
      return false
    }
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return false
  }
}

// Create a new calendar category
export function createCalendarCategory(category: Omit<CalendarCategory, "id">): CalendarCategory {
  try {
    const newCategory: CalendarCategory = {
      id: generateId(),
      ...category,
    }

    const categories = loadCalendarCategories()
    categories.push(newCategory)
    saveCalendarCategories(categories)

    return newCategory
  } catch (error) {
    console.error("Error creating calendar category:", error)
    throw error
  }
}

// Update a calendar category
export function updateCalendarCategory(
  categoryId: string,
  updates: Partial<CalendarCategory>,
): CalendarCategory | null {
  try {
    const categories = loadCalendarCategories()
    const index = categories.findIndex((c) => c.id === categoryId)

    if (index === -1) return null

    categories[index] = {
      ...categories[index],
      ...updates,
    }

    saveCalendarCategories(categories)
    return categories[index]
  } catch (error) {
    console.error("Error updating calendar category:", error)
    return null
  }
}

// Delete a calendar category
export function deleteCalendarCategory(categoryId: string): boolean {
  try {
    const categories = loadCalendarCategories()
    const filteredCategories = categories.filter((c) => c.id !== categoryId)

    if (filteredCategories.length === categories.length) return false

    saveCalendarCategories(filteredCategories)
    return true
  } catch (error) {
    console.error("Error deleting calendar category:", error)
    return false
  }
}

// Get events for a specific date range
export async function getEventsInRange(start: Date, end: Date): Promise<CalendarEvent[]> {
  try {
    const events = await loadCalendarEvents()
    return events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      // Check if the event overlaps with the range
      return eventStart <= end && eventEnd >= start
    })
  } catch (error) {
    console.error("Error getting events in range:", error)
    return []
  }
}

// Get events for a specific date
export async function getEventsForDate(date: Date): Promise<CalendarEvent[]> {
  try {
    const events = await loadCalendarEvents()
    return events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      // For all-day events, check if the date falls within the event duration
      if (event.allDay) {
        const startDate = new Date(eventStart)
        startDate.setHours(0, 0, 0, 0)

        const endDate = new Date(eventEnd)
        endDate.setHours(23, 59, 59, 999)

        const checkDate = new Date(date)
        checkDate.setHours(12, 0, 0, 0)

        return checkDate >= startDate && checkDate <= endDate
      }

      // For regular events, check if the event occurs on this date
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      return eventStart <= endOfDay && eventEnd >= startOfDay
    })
  } catch (error) {
    console.error("Error getting events for date:", error)
    return []
  }
}

// Generate recurring event instances
function generateRecurringEventInstances(parentEvent: CalendarEvent): CalendarEvent[] {
  if (!parentEvent.recurrence || parentEvent.recurrence.type === "none") {
    return []
  }

  const instances: CalendarEvent[] = []
  const startDate = new Date(parentEvent.start)
  const endDate = new Date(parentEvent.end)
  const duration = endDate.getTime() - startDate.getTime()

  // Determine how many instances to generate
  let maxInstances = 52 // Default to a year of weekly events
  let endDateTime: Date | undefined

  if (parentEvent.recurrence.endType === "on-date" && parentEvent.recurrence.endDate) {
    endDateTime = new Date(parentEvent.recurrence.endDate)
    maxInstances = 365 // Arbitrary large number, will be limited by end date
  } else if (parentEvent.recurrence.endType === "after" && parentEvent.recurrence.endAfter) {
    maxInstances = parentEvent.recurrence.endAfter
  } else {
    // If "never" ends, limit to a reasonable number for performance
    maxInstances = 52
  }

  // Generate instances based on recurrence type
  let currentDate = new Date(startDate)
  let instanceCount = 0

  while (instanceCount < maxInstances) {
    // Move to the next occurrence
    if (instanceCount > 0) {
      // Skip the first one as it's the parent event
      if (parentEvent.recurrence.type === "daily") {
        currentDate = addDays(currentDate, parentEvent.recurrence.interval)
      } else if (parentEvent.recurrence.type === "weekly") {
        currentDate = addWeeks(currentDate, parentEvent.recurrence.interval)

        // Handle specific weekdays for weekly recurrence
        if (parentEvent.recurrence.weekdays && parentEvent.recurrence.weekdays.length > 0) {
          // This is simplified - a more complex implementation would handle multiple weekdays
          const currentDay = getDay(currentDate)
          const targetDays = parentEvent.recurrence.weekdays.sort()

          // Find the next target day
          let nextDay = targetDays.find((day) => day > currentDay)
          if (!nextDay) {
            nextDay = targetDays[0]
            currentDate = addWeeks(currentDate, 1)
          }

          // Adjust to the target day
          const daysToAdd = (nextDay - currentDay + 7) % 7
          currentDate = addDays(currentDate, daysToAdd)
        }
      } else if (parentEvent.recurrence.type === "monthly") {
        currentDate = addMonths(currentDate, parentEvent.recurrence.interval)

        // Handle specific day of month
        if (parentEvent.recurrence.monthDay) {
          const targetDay = Math.min(parentEvent.recurrence.monthDay, 28) // Simplification
          currentDate.setDate(targetDay)
        }
      } else if (parentEvent.recurrence.type === "yearly") {
        currentDate = addYears(currentDate, parentEvent.recurrence.interval)
      }
    }

    // Check if we've reached the end date
    if (endDateTime && currentDate > endDateTime) {
      break
    }

    // Skip the first instance as it's the parent event
    if (instanceCount > 0) {
      // Calculate the end time based on the duration
      const instanceEndDate = new Date(currentDate.getTime() + duration)

      // Create the instance
      const instance: CalendarEvent = {
        ...parentEvent,
        id: generateId(),
        start: currentDate.toISOString(),
        end: instanceEndDate.toISOString(),
        parentEventId: parentEvent.id,
        isRecurringInstance: true,
        createdAt: parentEvent.createdAt,
        updatedAt: parentEvent.updatedAt,
      }

      instances.push(instance)
    }

    instanceCount++
  }

  return instances
}

// Get default event colors for different event types
export function getEventTypeColor(type: EventType): string {
  switch (type) {
    case "meeting":
      return "#4285F4" // Blue
    case "task":
      return "#0F9D58" // Green
    case "reminder":
      return "#F4B400" // Yellow
    case "out-of-office":
      return "#DB4437" // Red
    case "personal":
      return "#673AB7" // Purple
    case "unavailable":
      return "#EF4444" // Red
    default:
      return "#4285F4" // Blue
  }
}

// Get the next upcoming events
export async function getUpcomingEvents(userId: string, limit = 5): Promise<CalendarEvent[]> {
  try {
    const now = new Date()
    const events = await loadCalendarEvents()

    return events
      .filter((event) => {
        // Filter events that haven't ended yet
        const eventEnd = new Date(event.end)
        return eventEnd >= now && (event.createdBy === userId || event.attendees?.includes(userId))
      })
      .sort((a, b) => {
        // Sort by start time
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })
      .slice(0, limit)
  } catch (error) {
    console.error("Error getting upcoming events:", error)
    return []
  }
}

// Process reminders that need to be sent
export function processReminders(): void {
  try {
    const now = new Date()
    const events = loadCalendarEvents()
    let updated = false

    events.forEach((event) => {
      if (!event.reminders || event.reminders.length === 0) return

      const eventStart = new Date(event.start)

      event.reminders.forEach((reminder) => {
        if (reminder.sent) return

        // Calculate when the reminder should be sent
        let reminderTime = new Date(eventStart)

        switch (reminder.time) {
          case "at-time":
            reminderTime = eventStart
            break
          case "5-minutes":
            reminderTime = new Date(eventStart.getTime() - 5 * 60 * 1000)
            break
          case "10-minutes":
            reminderTime = new Date(eventStart.getTime() - 10 * 60 * 1000)
            break
          case "15-minutes":
            reminderTime = new Date(eventStart.getTime() - 15 * 60 * 1000)
            break
          case "30-minutes":
            reminderTime = new Date(eventStart.getTime() - 30 * 60 * 1000)
            break
          case "1-hour":
            reminderTime = new Date(eventStart.getTime() - 60 * 60 * 1000)
            break
          case "2-hours":
            reminderTime = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000)
            break
          case "1-day":
            reminderTime = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000)
            break
          case "2-days":
            reminderTime = new Date(eventStart.getTime() - 2 * 24 * 60 * 60 * 1000)
            break
        }

        // Check if it's time to send the reminder
        if (now >= reminderTime) {
          // In a real app, this would send an actual notification
          console.log(`Reminder for event: ${event.title} at ${format(eventStart, "PPpp")}`)

          // Mark the reminder as sent
          reminder.sent = true
          updated = true
        }
      })
    })

    if (updated) {
      saveCalendarEvents(events)
    }
  } catch (error) {
    console.error("Error processing reminders:", error)
  }
}

// Format date for display
export function formatEventTime(event: CalendarEvent): string {
  try {
    const start = new Date(event.start)
    const end = new Date(event.end)

    if (event.allDay) {
      return "All day"
    }

    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
  } catch (error) {
    console.error("Error formatting event time:", error)
    return "Invalid time"
  }
}

// Get a human-readable recurrence description
export function getRecurrenceDescription(recurrence?: RecurrenceRule): string {
  if (!recurrence || recurrence.type === "none") {
    return "Does not repeat"
  }

  let description = ""

  switch (recurrence.type) {
    case "daily":
      description = recurrence.interval === 1 ? "Daily" : `Every ${recurrence.interval} days`
      break
    case "weekly":
      description = recurrence.interval === 1 ? "Weekly" : `Every ${recurrence.interval} weeks`

      if (recurrence.weekdays && recurrence.weekdays.length > 0) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const selectedDays = recurrence.weekdays.map((day) => days[day]).join(", ")
        description += ` on ${selectedDays}`
      }
      break
    case "monthly":
      description = recurrence.interval === 1 ? "Monthly" : `Every ${recurrence.interval} months`

      if (recurrence.monthDay) {
        description += ` on day ${recurrence.monthDay}`
      }
      break
    case "yearly":
      description = recurrence.interval === 1 ? "Yearly" : `Every ${recurrence.interval} years`
      break
  }

  // Add end condition
  if (recurrence.endType === "after" && recurrence.endAfter) {
    description += `, ${recurrence.endAfter} times`
  } else if (recurrence.endType === "on-date" && recurrence.endDate) {
    description += `, until ${format(new Date(recurrence.endDate), "MMM d, yyyy")}`
  }

  return description
}

// Initialize default categories for a user
export function initializeDefaultCategories(userId: string): void {
  const existingCategories = loadCalendarCategories()
  const userCategories = existingCategories.filter((c) => c.userId === userId)

  if (userCategories.length === 0) {
    const defaultCategories: Omit<CalendarCategory, "id">[] = [
      { name: "Work", color: "#4285F4", visible: true, userId },
      { name: "Personal", color: "#673AB7", visible: true, userId },
      { name: "Family", color: "#0F9D58", visible: true, userId },
      { name: "Holiday", color: "#F4B400", visible: true, userId },
      { name: "Travel", color: "#FF5722", visible: true, userId },
    ]

    defaultCategories.forEach((category) => {
      createCalendarCategory(category)
    })
  }
}

export async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  try {
    const events = await loadCalendarEvents()
    return events.filter((e) => e.createdBy === userId || e.attendees?.includes(userId))
  } catch (error) {
    console.error("Error getting user events:", error)
    return []
  }
}

// Check if a user is available at a specific time
export function isUserAvailable(userId: string, start: Date, end: Date): boolean {
  // Get user availability
  const availability = loadUserAvailability(userId)
  if (!availability) return false

  // Get the date string for the start date
  const dateStr = format(start, "yyyy-MM-dd")

  // Find the availability for this date
  const dateAvailability = availability.dates.find((d) => d.date === dateStr)

  // If no specific availability is set for this date or user is not available, return false
  if (!dateAvailability || !dateAvailability.available) return false

  // Parse the start and end times for this date
  const [availStartHour, availStartMinute] = dateAvailability.startTime.split(":").map(Number)
  const [availEndHour, availEndMinute] = dateAvailability.endTime.split(":").map(Number)

  // Create Date objects for the available time range
  const availStart = new Date(start)
  availStart.setHours(availStartHour, availStartMinute, 0, 0)

  const availEnd = new Date(start)
  availEnd.setHours(availEndHour, availEndMinute, 0, 0)

  // Check if the requested time is within the available time range
  if (!(start >= availStart && end <= availEnd)) {
    return false
  }

  // Check if the time conflicts with any unavailable slots
  const startTimeStr = format(start, "HH:mm")
  const endTimeStr = format(end, "HH:mm")

  return !isTimeUnavailable(userId, start, startTimeStr, endTimeStr)
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Format time for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// Format date and time for display
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}

// Get availability events for calendar display
export function getAvailabilityEvents(userId: string): CalendarEvent[] {
  const availability = loadUserAvailability(userId)
  if (!availability) return []

  const events: CalendarEvent[] = []

  // Convert each available date to an event
  availability.dates.forEach((dateAvail) => {
    if (dateAvail.available) {
      const dateStr = dateAvail.date
      const [year, month, day] = dateStr.split("-").map(Number)

      // Create start and end times
      const startTime = new Date(year, month - 1, day)
      const [startHour, startMinute] = dateAvail.startTime.split(":").map(Number)
      startTime.setHours(startHour, startMinute, 0, 0)

      const endTime = new Date(year, month - 1, day)
      const [endHour, endMinute] = dateAvail.endTime.split(":").map(Number)
      endTime.setHours(endHour, endMinute, 0, 0)

      events.push({
        id: `avail-${userId}-${dateStr}`,
        title: "Available",
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        type: "availability",
        status: "confirmed",
        createdBy: userId,
        attendees: [userId],
        color: "#4ade80", // Green color for availability
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  })

  // Add unavailable time slots as events
  availability.unavailableSlots.forEach((slot) => {
    const dateStr = slot.date
    const [year, month, day] = dateStr.split("-").map(Number)

    // Create start and end times
    const startTime = new Date(year, month - 1, day)
    const [startHour, startMinute] = slot.startTime.split(":").map(Number)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(year, month - 1, day)
    const [endHour, endMinute] = slot.endTime.split(":").map(Number)
    endTime.setHours(endHour, endMinute, 0, 0)

    events.push({
      id: `unavail-${slot.id}`,
      title: slot.title || "Unavailable",
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      type: "unavailable",
      status: "confirmed",
      createdBy: userId,
      color: "#ef4444", // Red color for unavailability
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  return events
}

// Get availability status for a time range
export function getAvailabilityStatus(
  userId: string,
  date: Date,
  startTime: string,
  endTime: string,
): { available: boolean; reason?: string } {
  try {
    // Get user availability
    const availability = loadUserAvailability(userId)
    if (!availability) {
      return { available: false, reason: "No availability information found" }
    }

    // Check whole day availability first
    const dateStr = format(date, "yyyy-MM-dd")
    const dateAvail = availability.dates.find((d) => d.date === dateStr)

    if (!dateAvail) {
      return { available: false, reason: "No availability set for this date" }
    }

    if (!dateAvail.available) {
      return { available: false, reason: "Marked as unavailable for this day" }
    }

    // Check working hours
    const [availStartHour, availStartMinute] = dateAvail.startTime.split(":").map(Number)
    const [availEndHour, availEndMinute] = dateAvail.endTime.split(":").map(Number)
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    // Create comparable time values (minutes since midnight)
    const availStartMinutes = availStartHour * 60 + availStartMinute
    const availEndMinutes = availEndHour * 60 + availEndMinute
    const requestStartMinutes = startHour * 60 + startMinute
    const requestEndMinutes = endHour * 60 + endMinute

    if (requestStartMinutes < availStartMinutes) {
      return {
        available: false,
        reason: `Before working hours (starts at ${dateAvail.startTime})`,
      }
    }

    if (requestEndMinutes > availEndMinutes) {
      return {
        available: false,
        reason: `After working hours (ends at ${dateAvail.endTime})`,
      }
    }

    // Check for conflicts with unavailable slots
    for (const slot of availability.unavailableSlots) {
      if (slot.date !== dateStr) continue

      const [slotStartHour, slotStartMinute] = slot.startTime.split(":").map(Number)
      const [slotEndHour, slotEndMinute] = slot.endTime.split(":").map(Number)

      const slotStartMinutes = slotStartHour * 60 + slotStartMinute
      const slotEndMinutes = slotEndHour * 60 + slotEndMinute

      // Check for overlap (if not completely before or after)
      const overlap = !(requestEndMinutes <= slotStartMinutes || requestStartMinutes >= slotEndMinutes)

      if (overlap) {
        return {
          available: false,
          reason: slot.title ? `Unavailable: ${slot.title}` : `Unavailable from ${slot.startTime} to ${slot.endTime}`,
        }
      }
    }

    // If we got here, the time is available
    return { available: true }
  } catch (error) {
    console.error("Error checking availability status:", error)
    return { available: false, reason: "Error checking availability" }
  }
}

// Get events for multiple users
export async function getEventsForUsers(userIds: string[]): Promise<CalendarEvent[]> {
  try {
    const allEvents = await loadCalendarEvents()
    return allEvents.filter((event) => {
      // Include events where any of the specified users is the creator, attendee, or assignee
      return userIds.some(userId => 
        event.createdBy === userId || 
        event.attendees?.includes(userId) || 
        event.assignedTo?.includes(userId)
      )
    })
  } catch (error) {
    console.error("Error getting events for users:", error)
    return []
  }
}

// Get user color for calendar display
export function getUserCalendarColor(userId: string, userIndex: number = 0): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange  
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#84cc16", // lime
    "#f59e0b", // amber
  ]
  
  // Use a hash of the userId to get consistent colors
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Enhanced availability checking for multiple users
export function getTeamAvailability(userIds: string[], date: Date): Record<string, {
  available: boolean
  startTime?: string
  endTime?: string
  reason?: string
}> {
  const result: Record<string, {
    available: boolean
    startTime?: string
    endTime?: string
    reason?: string
  }> = {}

  userIds.forEach(userId => {
    const availability = loadUserAvailability(userId)
    const dateStr = format(date, "yyyy-MM-dd")
    
    if (availability) {
      const dateAvailability = availability.dates.find(d => d.date === dateStr)
      
      if (dateAvailability) {
        result[userId] = {
          available: dateAvailability.available,
          startTime: dateAvailability.startTime,
          endTime: dateAvailability.endTime,
        }
      } else {
        // Check if user has events on this date that might conflict
        // Note: This would need to be async but keeping sync for now for compatibility
        const userEvents: CalendarEvent[] = [] // TODO: Make this async
        const dayEvents = userEvents.filter(event => {
          const eventDate = new Date(event.start)
          return format(eventDate, "yyyy-MM-dd") === dateStr
        })
        
        result[userId] = {
          available: dayEvents.length === 0,
          reason: dayEvents.length > 0 ? `${dayEvents.length} scheduled events` : undefined
        }
      }
    } else {
      result[userId] = {
        available: true, // Default to available if no availability data
      }
    }
  })

  return result
}

// Find common available time slots for multiple users
export function findCommonAvailableSlots(
  userIds: string[], 
  date: Date, 
  durationMinutes: number = 60
): Array<{
  startTime: string
  endTime: string
  availableUsers: string[]
}> {
  const slots: Array<{
    startTime: string
    endTime: string
    availableUsers: string[]
  }> = []

  // Get all users' availability for the date
  const teamAvailability = getTeamAvailability(userIds, date)
  
  // Generate time slots (every 30 minutes from 9 AM to 5 PM)
  const startHour = 9
  const endHour = 17
  const slotDuration = 30 // minutes
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const slotEndMinutes = minute + durationMinutes
      const slotEndHour = hour + Math.floor(slotEndMinutes / 60)
      const slotEndMinute = slotEndMinutes % 60
      
      if (slotEndHour >= endHour) break // Don't go past end hour
      
      const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`
      
      // Check which users are available during this slot
      const availableUsers = userIds.filter(userId => {
        const userAvail = teamAvailability[userId]
        if (!userAvail.available) return false
        
        // Check if the slot falls within user's available hours
        if (userAvail.startTime && userAvail.endTime) {
          return slotStart >= userAvail.startTime && slotEnd <= userAvail.endTime
        }
        
        return true
      })
      
      // Only include slots where at least 2 users are available
      if (availableUsers.length >= 2) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          availableUsers
        })
      }
    }
  }
  
  return slots
}

// Enhanced event creation with better conflict detection
export function createCalendarEventWithConflictCheck(
  event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
  checkConflicts: boolean = true
): { event: CalendarEvent | null; conflicts: CalendarEvent[] } {
  const conflicts: CalendarEvent[] = []
  
  if (checkConflicts && event.attendees) {
    // Check for conflicts with attendees' calendars
    const startTime = new Date(event.start)
    const endTime = new Date(event.end)
    
    event.attendees.forEach(userId => {
      // Note: This would need to be async but keeping sync for now for compatibility
      const userEvents: CalendarEvent[] = [] // TODO: Make this async
      const userConflicts = userEvents.filter(existingEvent => {
        const existingStart = new Date(existingEvent.start)
        const existingEnd = new Date(existingEvent.end)
        
        // Check for time overlap
        return (startTime < existingEnd && endTime > existingStart)
      })
      
      conflicts.push(...userConflicts)
    })
  }
  
  // Create the event even if there are conflicts (let user decide)
  // Note: This should be async but keeping sync for now for compatibility
  const createdEvent = null // TODO: Make this async
  
  return {
    event: createdEvent,
    conflicts: conflicts
  }
}

// Get calendar statistics for a user
export function getUserCalendarStats(userId: string): {
  totalEvents: number
  upcomingEvents: number
  todayEvents: number
  weekEvents: number
  monthEvents: number
  availabilityDays: number
} {
  const userEvents = getUserEvents(userId)
  const availability = loadUserAvailability(userId)
  const now = new Date()
  const today = format(now, "yyyy-MM-dd")
  const weekFromNow = addDays(now, 7)
  const monthFromNow = addMonths(now, 1)
  
  const upcomingEvents = userEvents.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate >= now
  })
  
  const todayEvents = userEvents.filter(event => {
    const eventDate = new Date(event.start)
    return format(eventDate, "yyyy-MM-dd") === today
  })
  
  const weekEvents = userEvents.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate >= now && eventDate <= weekFromNow
  })
  
  const monthEvents = userEvents.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate >= now && eventDate <= monthFromNow
  })
  
  return {
    totalEvents: userEvents.length,
    upcomingEvents: upcomingEvents.length,
    todayEvents: todayEvents.length,
    weekEvents: weekEvents.length,
    monthEvents: monthEvents.length,
    availabilityDays: availability?.dates.length || 0
  }
}
