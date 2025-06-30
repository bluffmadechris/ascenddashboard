"use client"

// Function to load data from localStorage
export function loadData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue
  }

  try {
    const storedData = localStorage.getItem(`ascend-media-${key}`)
    if (!storedData) {
      return defaultValue
    }

    return JSON.parse(storedData) as T
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error)
    return defaultValue
  }
}

// Function to save data to localStorage
export function saveData<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(`ascend-media-${key}`, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error)
  }
}

// Function to remove data from localStorage
export function removeData(key: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem(`ascend-media-${key}`)
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error)
  }
}

// Function to clear all app data from localStorage
export function clearAllData(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("ascend-media-")) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch (error) {
    console.error("Error clearing all data:", error)
  }
}

// Function to export all data to a JSON file
export function exportAllData(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("ascend-media-")) {
        const value = localStorage.getItem(key)
        if (value) {
          data[key.replace("ascend-media-", "")] = JSON.parse(value)
        }
      }
    }

    const json = JSON.stringify(data)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ascend-media-backup-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    localStorage.setItem("ascend-media-lastBackupTime", new Date().toISOString())
  } catch (error) {
    console.error("Error exporting all data:", error)
  }
}

// Function to import data from a JSON file
export function importData(jsonData: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const data = JSON.parse(jsonData)
    for (const key in data) {
      if (Object.hasOwn(data, key)) {
        localStorage.setItem(`ascend-media-${key}`, JSON.stringify(data[key]))
      }
    }
    return true
  } catch (error) {
    console.error("Error importing data:", error)
    return false
  }
}

// Function to get the last backup time
export function getLastBackupTime(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return localStorage.getItem("ascend-media-lastBackupTime") || null
  } catch (error) {
    console.error("Error getting last backup time:", error)
    return null
  }
}

// Function to check if there is any stored data
export function hasStoredData(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("ascend-media-")) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error("Error checking for stored data:", error)
    return false
  }
}
