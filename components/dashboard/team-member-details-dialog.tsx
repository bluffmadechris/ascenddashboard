"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { AlertCircle, Mail, Globe, Twitter, Instagram, Youtube, Clock, AlertTriangle, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { addStrike, type Strike } from "@/lib/strikes-system"
import { useToast } from "@/components/ui/use-toast"
import { loadData } from "@/lib/data-persistence"

interface TeamMemberDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: any // Replace with proper type
    clients: any[] // Replace with proper type
    strikes: Strike[]
}

export function TeamMemberDetailsDialog({ open, onOpenChange, member, clients, strikes }: TeamMemberDetailsDialogProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isAddingStrike, setIsAddingStrike] = useState(false)
    const [strikeReason, setStrikeReason] = useState("")

    if (!member) return null

    // Get active strikes (within last 60 days)
    const activeStrikes = strikes.filter(strike => {
        const strikeDate = new Date(strike.date)
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        return strikeDate > sixtyDaysAgo
    })

    const handleAddStrike = () => {
        if (!strikeReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for the strike",
                variant: "destructive",
            })
            return
        }

        addStrike(member.id, strikeReason, user?.id || "")
        setStrikeReason("")
        setIsAddingStrike(false)
        toast({
            title: "Strike Added",
            description: `Strike has been added to ${member.name}'s record.`,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Team Member Details</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-grow pr-4">
                    <div className="space-y-6">
                        {/* Strikes Section */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-yellow-500" />
                                        <h3 className="text-lg font-semibold">Strike Record</h3>
                                    </div>
                                    <Badge variant={activeStrikes.length >= 3 ? "destructive" : "outline"}>
                                        {activeStrikes.length} Active Strikes
                                    </Badge>
                                </div>

                                {activeStrikes.length >= 3 && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            This team member has reached the maximum number of strikes (3) within 60 days.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {strikes.length > 0 ? (
                                    <div className="space-y-4">
                                        {strikes.map((strike) => {
                                            const strikeDate = new Date(strike.date)
                                            const isActive = strikeDate > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                                            return (
                                                <div
                                                    key={strike.id}
                                                    className={`p-4 rounded-lg border ${isActive ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900" : "bg-muted/30"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <p className="font-medium">{strike.reason}</p>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{format(new Date(strike.date), "PPP")}</span>
                                                            </div>
                                                        </div>
                                                        {isActive && (
                                                            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-950">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No strikes on record</p>
                                )}

                                {isAddingStrike ? (
                                    <div className="mt-4 space-y-4">
                                        <Textarea
                                            placeholder="Enter the reason for this strike..."
                                            value={strikeReason}
                                            onChange={(e) => setStrikeReason(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setIsAddingStrike(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleAddStrike}>
                                                Add Strike
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        onClick={() => setIsAddingStrike(true)}
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Issue Strike
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Role and Contact */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Role</p>
                                        <p className="text-lg font-medium">{member.role}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            <a href={`mailto:${member.email}`} className="text-lg font-medium hover:underline">
                                                {member.email}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bio */}
                        {member.bio && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-2">About</h3>
                                    <p className="text-muted-foreground">{member.bio}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Clients */}
                        {clients && clients.length > 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Assigned Clients</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {clients.map((client: any) => (
                                            <Badge key={client.id} variant="outline" className="justify-center py-1">
                                                {client.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Social Media */}
                        {member.socialMedia && Object.keys(member.socialMedia).length > 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Social Media</h3>
                                    <div className="space-y-3">
                                        {member.socialMedia.website && (
                                            <a
                                                href={member.socialMedia.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 hover:text-primary"
                                            >
                                                <Globe className="h-4 w-4" />
                                                <span>Website</span>
                                            </a>
                                        )}
                                        {member.socialMedia.twitter && (
                                            <a
                                                href={member.socialMedia.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 hover:text-primary"
                                            >
                                                <Twitter className="h-4 w-4" />
                                                <span>Twitter</span>
                                            </a>
                                        )}
                                        {member.socialMedia.instagram && (
                                            <a
                                                href={member.socialMedia.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 hover:text-primary"
                                            >
                                                <Instagram className="h-4 w-4" />
                                                <span>Instagram</span>
                                            </a>
                                        )}
                                        {member.socialMedia.youtube && (
                                            <a
                                                href={member.socialMedia.youtube}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 hover:text-primary"
                                            >
                                                <Youtube className="h-4 w-4" />
                                                <span>YouTube</span>
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
} 