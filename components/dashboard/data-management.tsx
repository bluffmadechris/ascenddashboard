"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { exportAllData, importData, getLastBackupTime, hasStoredData } from "@/lib/data-persistence"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export function DataManagement() {
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastBackupTime = getLastBackupTime()
  const hasData = hasStoredData()

  const handleExport = () => {
    exportAllData()
    toast({
      title: "Data exported",
      description: "Your data has been exported successfully.",
    })
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        const success = importData(jsonData)

        if (success) {
          toast({
            title: "Data imported",
            description: "Your data has been imported successfully.",
          })
        } else {
          toast({
            title: "Import failed",
            description: "There was an error importing your data. Please check the file format.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error reading file:", error)
        toast({
          title: "Import failed",
          description: "There was an error reading your file. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsImporting(false)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }

    reader.onerror = () => {
      toast({
        title: "Import failed",
        description: "There was an error reading your file. Please try again.",
        variant: "destructive",
      })
      setIsImporting(false)
    }

    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export or import your data to keep it across different versions of the website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <div className="text-sm">
            <p>
              You have data stored in this browser. To ensure it's not lost when updating the website, export it
              regularly.
            </p>
            {lastBackupTime && (
              <p className="mt-2">Last backup: {format(new Date(lastBackupTime), "MMMM d, yyyy 'at' h:mm a")}</p>
            )}
          </div>
        ) : (
          <div className="flex items-start space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>
              You don't have any data stored yet. As you use the application, your data will be saved in this browser.
            </p>
          </div>
        )}

        <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? "Importing..." : "Import Data"}
        </Button>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export All Data
        </Button>
      </CardFooter>
    </Card>
  )
}
