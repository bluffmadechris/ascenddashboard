"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, X } from "lucide-react"

interface EmailNotificationProps {
  show: boolean
  success: boolean
  message: string
  onClose: () => void
}

export function EmailNotification({ show, success, message, onClose }: EmailNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
        success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
      }`}
      role="alert"
    >
      <div className="flex items-center">
        {success ? (
          <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
        ) : (
          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        type="button"
        className="ml-4 inline-flex items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
        onClick={() => {
          setIsVisible(false)
          onClose()
        }}
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}
