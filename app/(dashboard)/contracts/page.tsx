"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, Download, Trash2 } from "lucide-react"

export default function ContractsPage() {
  const { user, users } = useAuth()
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [contracts, setContracts] = useState<Array<{
    id: string
    name: string
    assignedTo: string
    fileName: string
    uploadedBy: string
    uploadDate: string
  }>>([])

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("contract") as File
    const assignedTo = formData.get("assignedTo") as string
    
    // In a real app, you would upload the file to your storage service here
    const newContract = {
      id: Date.now().toString(),
      name: formData.get("name") as string,
      assignedTo,
      fileName: file.name,
      uploadedBy: user?.name || "Unknown",
      uploadDate: new Date().toISOString(),
    }
    
    setContracts([...contracts, newContract])
    setIsUploadDialogOpen(false)
  }

  const handleDownload = (contract: any) => {
    // In a real app, this would download the actual file from your storage service
    alert("Downloading contract: " + contract.fileName)
  }

  const handleDelete = (contractId: string) => {
    // In a real app, you would also delete the file from your storage service
    setContracts(contracts.filter((c) => c.id !== contractId))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">Upload and manage team member contracts</p>
        </div>
        {user?.role === "owner" && (
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Contract
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>View and download assigned contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No contracts yet</h3>
              <p className="text-sm text-muted-foreground">
                {user?.role === "owner" 
                  ? "Upload contracts to assign them to team members"
                  : "No contracts have been assigned to you yet"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div className="p-4">
                {contracts
                  .filter(contract => 
                    user?.role === "owner" || contract.assignedTo === user?.id
                  )
                  .map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between rounded-lg border p-4 mb-2"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{contract.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Assigned to: {users.find(u => u.id === contract.assignedTo)?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(contract)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {user?.role === "owner" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Contract</DialogTitle>
            <DialogDescription>
              Upload a contract and assign it to a team member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contract Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract">Contract File</Label>
              <Input id="contract" name="contract" type="file" accept=".pdf,.doc,.docx" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select name="assignedTo" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.id !== user?.id)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Upload Contract</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
