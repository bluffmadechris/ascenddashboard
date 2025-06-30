"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SendNotificationForm } from "@/components/dashboard/send-notification"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Send, Trash2, Edit, Eye, CheckCircle } from "lucide-react"

// Sample scheduled notifications
const scheduledNotifications = [
  {
    id: "sched1",
    title: "System Maintenance",
    message: "The system will be down for maintenance on Saturday night.",
    scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    targetType: "all",
    priority: "high",
    status: "scheduled",
  },
  {
    id: "sched2",
    title: "New Feature Announcement",
    message: "We're excited to announce our new reporting features!",
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    targetType: "all",
    priority: "medium",
    status: "scheduled",
  },
  {
    id: "sched3",
    title: "Team Meeting Reminder",
    message: "Don't forget about our quarterly planning meeting.",
    scheduledFor: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    targetType: "team",
    targetName: "Marketing",
    priority: "medium",
    status: "scheduled",
  },
]

// Sample sent notifications
const sentNotifications = [
  {
    id: "sent1",
    title: "Welcome to the New Dashboard",
    message: "We've updated our dashboard with new features.",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    targetType: "all",
    priority: "medium",
    status: "sent",
    readCount: 12,
    totalCount: 15,
  },
  {
    id: "sent2",
    title: "Invoice Processing Update",
    message: "We've improved our invoice processing system.",
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    targetType: "role",
    targetName: "Accounting",
    priority: "low",
    status: "sent",
    readCount: 3,
    totalCount: 3,
  },
  {
    id: "sent3",
    title: "Urgent: Security Update Required",
    message: "Please update your password as soon as possible.",
    sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    targetType: "all",
    priority: "urgent",
    status: "sent",
    readCount: 14,
    totalCount: 15,
    requiresAcknowledgment: true,
    acknowledgedCount: 13,
  },
]

export default function NotificationsManagementPage() {
  const [activeTab, setActiveTab] = useState("create")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications Management</h1>
        <p className="text-muted-foreground mt-2">Create, schedule, and manage notifications for your organization.</p>
      </div>

      <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Notification</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="sent">Sent History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <SendNotificationForm />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
              <CardDescription>View and manage notifications scheduled to be sent in the future.</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledNotifications.length > 0 ? (
                <div className="space-y-4">
                  {scheduledNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              notification.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : notification.priority === "medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {notification.scheduledFor.toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.scheduledFor.toLocaleTimeString()}
                          </div>
                          <div>
                            Recipients:{" "}
                            {notification.targetType === "all"
                              ? "All Users"
                              : `${notification.targetType.charAt(0).toUpperCase() + notification.targetType.slice(1)}: ${notification.targetName}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No scheduled notifications</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any notifications scheduled for the future.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("create")}>
                    <Send className="mr-2 h-4 w-4" />
                    Create Notification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
              <CardDescription>View history of notifications you've sent to your organization.</CardDescription>
            </CardHeader>
            <CardContent>
              {sentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {sentNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              notification.priority === "urgent"
                                ? "bg-red-100 text-red-800"
                                : notification.priority === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : notification.priority === "medium"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {notification.sentAt.toLocaleDateString()}
                          </div>
                          <div>
                            Recipients:{" "}
                            {notification.targetType === "all"
                              ? "All Users"
                              : `${notification.targetType.charAt(0).toUpperCase() + notification.targetType.slice(1)}: ${notification.targetName}`}
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            Read: {notification.readCount}/{notification.totalCount}
                          </div>
                          {notification.requiresAcknowledgment && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged: {notification.acknowledgedCount}/{notification.totalCount}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No sent notifications</h3>
                  <p className="text-muted-foreground mt-2">You haven't sent any notifications yet.</p>
                  <Button className="mt-4" onClick={() => setActiveTab("create")}>
                    <Send className="mr-2 h-4 w-4" />
                    Create Notification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
