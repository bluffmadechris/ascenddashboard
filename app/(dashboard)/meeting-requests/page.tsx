"use client"

import { MeetingRequestsList } from "@/components/dashboard/meeting-requests-list"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { RequestMeetingButton } from "@/components/dashboard/request-meeting-button"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function MeetingRequestsPage() {
  const { user, users } = useAuth()
  const [showRequestDialog, setShowRequestDialog] = useState(false)

  // Find the owner/CEO to request meetings from
  const owner = users.find(u => u.role === "owner" || u.role === "ceo")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Requests</h1>
          <p className="text-muted-foreground">
            {user?.role === "owner"
              ? "Manage meeting requests from your team members."
              : "View your meeting requests and their status."
            }
          </p>
        </div>

        {user?.role === "employee" && owner && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Request Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Meeting with {owner.name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <RequestMeetingButton
                  ownerId={owner.id}
                  ownerName={owner.name}
                  className="w-full"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <MeetingRequestsList />
    </div>
  )
}
