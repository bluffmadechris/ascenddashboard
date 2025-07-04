// Singleton audio instance for notification sounds
let notificationSound: HTMLAudioElement | null = null

export function playNotificationSound() {
  try {
    // Create audio instance if it doesn't exist
    if (!notificationSound) {
      notificationSound = new Audio("/notification-sound.mp3")
    }

    // Reset and play
    notificationSound.currentTime = 0
    notificationSound.volume = 0.5 // Set to 50% volume
    notificationSound.play().catch((error) => {
      console.error("Failed to play notification sound:", error)
    })
  } catch (error) {
    console.error("Error initializing notification sound:", error)
  }
}

// Function to check if sound is enabled in user preferences
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem("notificationSound") !== "disabled"
  } catch {
    return true // Default to enabled if localStorage is not available
  }
}

// Function to toggle sound preference
export function toggleNotificationSound(enabled: boolean) {
  try {
    if (enabled) {
      localStorage.removeItem("notificationSound")
    } else {
      localStorage.setItem("notificationSound", "disabled")
    }
  } catch (error) {
    console.error("Error saving sound preference:", error)
  }
} 