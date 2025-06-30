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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TeamMemberDetailsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: any // Replace with proper type
    clients: any[] // Replace with proper type
    strikes: Strike[]
}

export function TeamMemberDetails({ open, onOpenChange, member, clients, strikes }: TeamMemberDetailsProps) {
    const { user: currentUser } = useAuth()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState("info")
    const [strikeReason, setStrikeReason] = useState("")
    const [isAddingStrike, setIsAddingStrike] = useState(false)

    const canAddStrike = currentUser?.role === "owner" || currentUser?.role === "manager"

    const handleAddStrike = async () => {
        if (!strikeReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for the strike.",
                variant: "destructive",
            })
            return
        }

        setIsAddingStrike(true)
        try {
            await addStrike(member.id, strikeReason)
            toast({
                title: "Strike Added",
                description: "The strike has been recorded successfully.",
            })
            setStrikeReason("")
            onOpenChange(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add strike. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsAddingStrike(false)
        }
    }

    const getStrikeStatus = () => {
        const activeStrikes = strikes.filter(
            (strike) => new Date(strike.date).getTime() > Date.now() - 60 * 24 * 60 * 60 * 1000
        )
        return {
            total: activeStrikes.length,
            isWarning: activeStrikes.length === 2,
            isCritical: activeStrikes.length >= 3,
        }
    }

    const strikeStatus = getStrikeStatus()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        {member.name}
                        {strikeStatus.total > 0 && (
                            <Badge
                                variant={strikeStatus.isCritical ? "destructive" : strikeStatus.isWarning ? "warning" : "default"}
                                className="ml-2"
                            >
                                {strikeStatus.total} Strike{strikeStatus.total !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">Information</TabsTrigger>
                        <TabsTrigger value="strikes">
                            Strikes
                            {strikeStatus.total > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {strikeStatus.total}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-4">
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6">
                                {/* Role & Contact */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Role</span>
                                            </div>
                                            <p className="text-sm">{member.role}</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Contact</span>
                                            </div>
                                            <a href={`mailto:${member.email}`} className="text-sm text-primary hover:underline">
                                                {member.email}
                                            </a>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Bio */}
                                {member.bio && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="font-medium">About</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.bio}</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Client Assignments */}
                                {clients.length > 0 && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <h3 className="font-medium mb-4">Client Assignments</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {clients.map((client: any) => (
                                                    <div
                                                        key={client.id}
                                                        className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm"
                                                    >
                                                        {client.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Social Media */}
                                {member.socialMedia && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <h3 className="font-medium mb-4">Social Media</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {member.socialMedia.twitter && (
                                                    <a
                                                        href={member.socialMedia.twitter}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                                    >
                                                        <Twitter className="h-4 w-4" />
                                                        Twitter
                                                    </a>
                                                )}
                                                {member.socialMedia.instagram && (
                                                    <a
                                                        href={member.socialMedia.instagram}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                                    >
                                                        <Instagram className="h-4 w-4" />
                                                        Instagram
                                                    </a>
                                                )}
                                                {member.socialMedia.youtube && (
                                                    <a
                                                        href={member.socialMedia.youtube}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                                    >
                                                        <Youtube className="h-4 w-4" />
                                                        YouTube
                                                    </a>
                                                )}
                                                {member.socialMedia.website && (
                                                    <a
                                                        href={member.socialMedia.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                                    >
                                                        <Globe className="h-4 w-4" />
                                                        Website
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="strikes" className="mt-4">
                        <ScrollArea className="max-h-[60vh]">
                            {strikeStatus.total > 0 && (
                                <Alert variant={strikeStatus.isCritical ? "destructive" : strikeStatus.isWarning ? "warning" : "default"} className="mb-4">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        {strikeStatus.isCritical
                                            ? "Critical: Maximum strikes reached. Account review required."
                                            : strikeStatus.isWarning
                                                ? "Warning: One more strike will result in account review."
                                                : "Active strikes present."}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                {/* Active Strikes */}
                                <div>
                                    <h3 className="font-medium mb-3 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        Active Strikes
                                    </h3>
                                    <div className="space-y-3">
                                        {strikes
                                            .filter((strike) => {
                                                const strikeDate = new Date(strike.date)
                                                const expiryDate = new Date(strikeDate)
                                                expiryDate.setDate(expiryDate.getDate() + 60)
                                                return expiryDate > new Date()
                                            })
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((strike) => {
                                                const strikeDate = new Date(strike.date)
                                                const expiryDate = new Date(strikeDate)
                                                expiryDate.setDate(expiryDate.getDate() + 60)
                                                const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                                                return (
                                                    <Card key={strike.id}>
                                                        <CardContent className="pt-6">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-grow">
                                                                    <p className="text-sm text-muted-foreground mb-2">
                                                                        {strike.reason}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span>
                                                                            Issued on {format(strikeDate, "MMM d, yyyy")}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Badge variant={daysLeft < 7 ? "success" : "secondary"}>
                                                                    {daysLeft} days left
                                                                </Badge>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        {strikes.filter((strike) => {
                                            const strikeDate = new Date(strike.date)
                                            const expiryDate = new Date(strikeDate)
                                            expiryDate.setDate(expiryDate.getDate() + 60)
                                            return expiryDate > new Date()
                                        }).length === 0 && (
                                                <p className="text-sm text-muted-foreground">No active strikes</p>
                                            )}
                                    </div>
                                </div>

                                {/* Strike History */}
                                <div>
                                    <h3 className="font-medium mb-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        Strike History
                                    </h3>
                                    <div className="space-y-3">
                                        {strikes
                                            .filter((strike) => {
                                                const strikeDate = new Date(strike.date)
                                                const expiryDate = new Date(strikeDate)
                                                expiryDate.setDate(expiryDate.getDate() + 60)
                                                return expiryDate <= new Date()
                                            })
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((strike) => (
                                                <Card key={strike.id}>
                                                    <CardContent className="pt-6">
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {strike.reason}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                Issued on {format(new Date(strike.date), "MMM d, yyyy")}
                                                            </span>
                                                            <Badge variant="outline">Expired</Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        {strikes.filter((strike) => {
                                            const strikeDate = new Date(strike.date)
                                            const expiryDate = new Date(strikeDate)
                                            expiryDate.setDate(expiryDate.getDate() + 60)
                                            return expiryDate <= new Date()
                                        }).length === 0 && (
                                                <p className="text-sm text-muted-foreground">No strike history</p>
                                            )}
                                    </div>
                                </div>

                                {/* Add Strike Form */}
                                {canAddStrike && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h3 className="font-medium mb-3">Add Strike</h3>
                                        <div className="space-y-3">
                                            <Textarea
                                                placeholder="Enter reason for strike..."
                                                value={strikeReason}
                                                onChange={(e) => setStrikeReason(e.target.value)}
                                            />
                                            <Button
                                                onClick={handleAddStrike}
                                                disabled={isAddingStrike || !strikeReason.trim()}
                                                className="w-full"
                                            >
                                                {isAddingStrike ? "Adding Strike..." : "Add Strike"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
} 