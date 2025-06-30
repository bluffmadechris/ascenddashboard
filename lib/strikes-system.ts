"use client"

import { loadData, saveData } from "@/lib/data-persistence"
import { generateId } from "@/lib/uuid"

export interface Strike {
  id: string
  userId: string
  reason: string
  date: string
  issuedBy: string
}

// Add notification types
export interface StrikeNotification {
  id: string
  userId: string
  strikeId: string
  type: 'new_strike' | 'strike_warning' | 'strike_critical' | 'strike_expired'
  message: string
  date: string
  read: boolean
}

// Get active strikes for a user (strikes within the last 60 days)
export function getActiveStrikes(userId: string): Strike[] {
  const strikes = loadData("strikes", []) as Strike[]
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  return strikes.filter(
    (strike) => strike.userId === userId && new Date(strike.date) > sixtyDaysAgo
  )
}

// Create a notification
export function createStrikeNotification(
  userId: string,
  strikeId: string,
  type: StrikeNotification['type'],
  message: string
): void {
  const notifications = loadData("notifications", []) as StrikeNotification[]
  
  const newNotification: StrikeNotification = {
    id: generateId(),
    userId,
    strikeId,
    type,
    message,
    date: new Date().toISOString(),
    read: false
  }
  
  notifications.push(newNotification)
  saveData("notifications", notifications)
}

// Modify addStrike to include notifications
export async function addStrike(userId: string, reason: string): Promise<boolean> {
  try {
    // Load existing strikes
    const strikes = loadData("strikes", []) as Strike[]

    // Generate a unique ID for the new strike
    const newStrikeId = generateId()

    // Create the new strike
    const newStrike: Strike = {
      id: newStrikeId,
      userId,
      reason,
      date: new Date().toISOString(),
      issuedBy: "system", // This could be updated to include the current user's ID
    }

    // Add the new strike to the list
    strikes.push(newStrike)

    // Save the updated strikes list
    saveData("strikes", strikes)

    // Clean up expired strikes (older than 60 days)
    cleanupExpiredStrikes()

    // Get updated strike status
    const status = getStrikeStatus(userId)

    // Create appropriate notifications
    createStrikeNotification(
      userId,
      newStrikeId,
      'new_strike',
      `You have received a new strike: ${reason}`
    )

    if (status.isWarning) {
      createStrikeNotification(
        userId,
        newStrikeId,
        'strike_warning',
        'Warning: You have received your second strike. One more strike will result in account review.'
      )
    }

    if (status.isCritical) {
      createStrikeNotification(
        userId,
        newStrikeId,
        'strike_critical',
        'Critical: You have reached the maximum number of strikes. Your account is under review.'
      )
    }

    return true
  } catch (error) {
    console.error("Failed to add strike:", error)
    return false
  }
}

// Remove a strike
export function removeStrike(strikeId: string): void {
  const strikes = loadData("strikes", []) as Strike[]
  const updatedStrikes = strikes.filter(strike => strike.id !== strikeId)
  saveData("strikes", updatedStrikes)
}

// Get all strikes for a user
export function getAllStrikes(userId: string): Strike[] {
  const strikes = loadData("strikes", []) as Strike[]
  return strikes.filter(strike => strike.userId === userId)
}

// Modify cleanupExpiredStrikes to handle notifications
export function cleanupExpiredStrikes(): void {
  const strikes = loadData("strikes", []) as Strike[]
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const expiredStrikes = strikes.filter(
    (strike) => new Date(strike.date) <= sixtyDaysAgo
  )

  const activeStrikes = strikes.filter(
    (strike) => new Date(strike.date) > sixtyDaysAgo
  )

  // Create notifications for expired strikes
  expiredStrikes.forEach(strike => {
    createStrikeNotification(
      strike.userId,
      strike.id,
      'strike_expired',
      'A strike on your account has expired.'
    )
  })

  if (activeStrikes.length !== strikes.length) {
    saveData("strikes", activeStrikes)
  }
}

// Check if a team member has reached the strike limit
export function hasReachedStrikeLimit(userId: string): boolean {
  const activeStrikes = getActiveStrikes(userId)
  return activeStrikes.length >= 3
}

// Get strike status for a team member
export function getStrikeStatus(userId: string): {
  total: number
  isWarning: boolean
  isCritical: boolean
} {
  const activeStrikes = getActiveStrikes(userId)
  return {
    total: activeStrikes.length,
    isWarning: activeStrikes.length === 2,
    isCritical: activeStrikes.length >= 3,
  }
}

// Get unread notifications for a user
export function getUnreadStrikeNotifications(userId: string): StrikeNotification[] {
  const notifications = loadData("notifications", []) as StrikeNotification[]
  return notifications.filter(notification => 
    notification.userId === userId && !notification.read
  )
}

// Mark notification as read
export function markNotificationAsRead(notificationId: string): void {
  const notifications = loadData("notifications", []) as StrikeNotification[]
  const updatedNotifications = notifications.map(notification =>
    notification.id === notificationId
      ? { ...notification, read: true }
      : notification
  )
  saveData("notifications", updatedNotifications)
} 