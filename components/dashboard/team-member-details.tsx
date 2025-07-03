"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { AlertCircle, Mail, Globe, Twitter, Instagram, Youtube, Clock, AlertTriangle, Shield, FileText, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { addStrike, type Strike, createStrikeAppeal, canAppealStrike, getAppealsForUser, type StrikeAppeal } from "@/lib/strikes-system"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

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
    const [showAppealDialog, setShowAppealDialog] = useState(false)
    const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null)
    const [appealReason, setAppealReason] = useState("")
    const [appealDescription, setAppealDescription] = useState("")
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false)
    const [appeals, setAppeals] = useState<StrikeAppeal[]>([])

    const canAddStrike = currentUser?.role === "owner" || currentUser?.role === "manager"
    const isViewingOwnProfile = currentUser?.id === member.id

    // Load appeals when component opens
    useState(() => {
        if (open && member.id) {
            setAppeals(getAppealsForUser(member.id))
        }
    })

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

    const handleAppealStrike = (strike: Strike) => {
        setSelectedStrike(strike)
        setAppealReason("")
        setAppealDescription("")
        setShowAppealDialog(true)
    }

    const handleSubmitAppeal = async () => {
        if (!selectedStrike || !appealReason.trim() || !appealDescription.trim()) {
            toast({
                title: "Error",
                description: "Please provide both a reason and description for your appeal.",
                variant: "destructive",
            })
            return
        }

        setIsSubmittingAppeal(true)
        try {
            const appeal = createStrikeAppeal(selectedStrike.id, member.id, appealReason.trim(), appealDescription.trim())
            if (appeal) {
                toast({
                    title: "Appeal Submitted",
                    description: "Your strike appeal has been submitted for review.",
                })
                setAppeals([...appeals, appeal])
                setShowAppealDialog(false)
                setSelectedStrike(null)
            } else {
                throw new Error("Failed to create appeal")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to submit appeal. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmittingAppeal(false)
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
        <>
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
                                    {strikes.length > 0 ? (
                                        <div className="space-y-3">
                                            {strikes.map((strike) => {
                                                const isActive = new Date(strike.date).getTime() > Date.now() - 60 * 24 * 60 * 60 * 1000
                                                const canAppeal = isViewingOwnProfile && canAppealStrike(strike.id)
                                                const existingAppeal = appeals.find(appeal => appeal.strikeId === strike.id)

                                                return (
                                                    <div key={strike.id} className={`p-3 border rounded-lg ${isActive ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'}`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1 flex-1">
                                                                <p className="font-medium">{strike.reason}</p>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{format(new Date(strike.date), "PPP")}</span>
                                                                </div>
                                                                {existingAppeal && (
                                                                    <div className="mt-2">
                                                                        <Badge
                                                                            variant={existingAppeal.status === 'pending' ? 'outline' : existingAppeal.status === 'approved' ? 'success' : 'destructive'}
                                                                            className="text-xs"
                                                                        >
                                                                            Appeal {existingAppeal.status}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {isActive && (
                                                                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-950">
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                                {canAppeal && isActive && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleAppealStrike(strike)}
                                                                        className="text-xs h-7"
                                                                    >
                                                                        Appeal
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-4">No strikes on record</p>
                                    )}

                                    {canAddStrike && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-medium mb-2">Add Strike</h4>
                                            <div className="space-y-2">
                                                <Textarea
                                                    placeholder="Reason for strike..."
                                                    value={strikeReason}
                                                    onChange={(e) => setStrikeReason(e.target.value)}
                                                />
                                                <Button
                                                    onClick={handleAddStrike}
                                                    disabled={isAddingStrike || !strikeReason.trim()}
                                                    variant="destructive"
                                                    size="sm"
                                                >
                                                    {isAddingStrike ? "Adding..." : "Add Strike"}
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

            {/* Strike Appeal Dialog */}
            <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Appeal Strike</DialogTitle>
                    </DialogHeader>

                    {selectedStrike && (
                        <div className="space-y-4 py-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-medium">Strike Details</h4>
                                <p className="text-sm text-muted-foreground mt-1">{selectedStrike.reason}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Issued on {format(new Date(selectedStrike.date), "PPP")}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="appealReason">Appeal Reason *</Label>
                                <Input
                                    id="appealReason"
                                    value={appealReason}
                                    onChange={(e) => setAppealReason(e.target.value)}
                                    placeholder="Brief reason for appeal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="appealDescription">Detailed Explanation *</Label>
                                <Textarea
                                    id="appealDescription"
                                    value={appealDescription}
                                    onChange={(e) => setAppealDescription(e.target.value)}
                                    placeholder="Provide a detailed explanation of why this strike should be removed..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAppealDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitAppeal}
                            disabled={isSubmittingAppeal || !appealReason.trim() || !appealDescription.trim()}
                        >
                            {isSubmittingAppeal ? "Submitting..." : "Submit Appeal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
} 