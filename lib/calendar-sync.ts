import { loadData, saveData } from "@/lib/data-persistence"
import { generateId } from "@/lib/uuid"

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: string
  end: string
  allDay: boolean
  userId: string
  type: "task" | "meeting" | "project"
  taskId?: string
  meetingId?: string
  projectId?: string
}

export function syncTaskToCalendar(task: {
  id: string
  name: string
  description?: string
  dueDate: string
  assignedTo: string
}) {
  try {
    // Load existing calendar events
    const calendarEvents = loadData<CalendarEvent[]>("calendar-events", [])

    // Create new calendar event for the task
    const newEvent: CalendarEvent = {
      id: generateId(),
      title: task.name,
      description: task.description,
      start: task.dueDate,
      end: task.dueDate,
      allDay: true,
      userId: task.assignedTo,
      type: "task",
      taskId: task.id,
    }

    // Add the new event
    saveData("calendar-events", [...calendarEvents, newEvent])

    return true
  } catch (error) {
    console.error("Error syncing task to calendar:", error)
    return false
  }
}

export function removeTaskFromCalendar(taskId: string) {
  try {
    // Load existing calendar events
    const calendarEvents = loadData<CalendarEvent[]>("calendar-events", [])

    // Remove events for this task
    const updatedEvents = calendarEvents.filter((event) => event.taskId !== taskId)

    // Save updated events
    saveData("calendar-events", updatedEvents)

    return true
  } catch (error) {
    console.error("Error removing task from calendar:", error)
    return false
  }
}

export function updateTaskInCalendar(task: {
  id: string
  name: string
  description?: string
  dueDate: string
  assignedTo: string
}) {
  try {
    // Load existing calendar events
    const calendarEvents = loadData<CalendarEvent[]>("calendar-events", [])

    // Find and update the event for this task
    const updatedEvents = calendarEvents.map((event) => {
      if (event.taskId === task.id) {
        return {
          ...event,
          title: task.name,
          description: task.description,
          start: task.dueDate,
          end: task.dueDate,
          userId: task.assignedTo,
        }
      }
      return event
    })

    // Save updated events
    saveData("calendar-events", updatedEvents)

    return true
  } catch (error) {
    console.error("Error updating task in calendar:", error)
    return false
  }
} 