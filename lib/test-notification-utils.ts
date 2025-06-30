/**
 * Utility functions for testing notification functionality
 */

// Function to check if notifications exist in localStorage
export function checkNotificationsInStorage(): boolean {
  const storedNotifications = localStorage.getItem("notifications")
  return !!storedNotifications
}

// Function to count notifications in localStorage
export function countNotificationsInStorage(): number {
  try {
    const storedNotifications = localStorage.getItem("notifications")
    if (!storedNotifications) return 0

    const parsed = JSON.parse(storedNotifications)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch (error) {
    console.error("Error counting notifications in storage:", error)
    return 0
  }
}

// Function to manually clear notifications from localStorage
export function forceCleanupNotifications(): void {
  try {
    localStorage.removeItem("notifications")
    console.log("Notifications forcibly removed from localStorage")

    // Dispatch event to notify components
    const event = new CustomEvent("notificationsCleared", {
      detail: { timestamp: new Date().toISOString(), forced: true },
    })
    window.dispatchEvent(event)
  } catch (error) {
    console.error("Error during forced notification cleanup:", error)
  }
}

// Function to verify notification state is consistent
export function verifyNotificationStateConsistency(
  contextCount: number,
  uiCount: number,
): { consistent: boolean; details: string } {
  const storageCount = countNotificationsInStorage()

  const consistent = contextCount === storageCount && contextCount === uiCount

  return {
    consistent,
    details: `Context: ${contextCount}, UI: ${uiCount}, Storage: ${storageCount}`,
  }
}

// Function to simulate a page reload effect on notifications
export function simulatePageReload(): void {
  try {
    // Get current notifications
    const storedNotifications = localStorage.getItem("notifications")

    // Remove and then restore to trigger storage events
    localStorage.removeItem("notifications")

    // Small delay to simulate page load timing
    setTimeout(() => {
      if (storedNotifications) {
        localStorage.setItem("notifications", storedNotifications)
      }

      console.log("Page reload simulation complete")
    }, 100)
  } catch (error) {
    console.error("Error simulating page reload:", error)
  }
}
