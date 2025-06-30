"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { MoreHorizontal, Download, Eye, Edit, Trash2, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { loadData, saveData } from "@/lib/data-persistence"
import { type Contract, ContractForm } from "./contract-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format, parseISO, isValid } from "date-fns"

export function ContractsList() {
  const { user, users } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>(loadData("contracts", []))
  const [viewingContract, setViewingContract] = useState<Contract | null>(null)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null)

  // Format date for display
  const formatContractDate = (dateString: string) => {
    if (!dateString) return "Not specified"

    try {
      // Try to parse the date in different formats
      let date
      if (dateString.includes("-")) {
        // If it's in yyyy-MM-dd format
        date = parseISO(dateString)
      } else {
        // If it's in MMM d, yyyy format
        date = new Date(dateString)
      }

      if (isValid(date)) {
        return format(date, "MMM d, yyyy")
      }
      return dateString
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const handleRefresh = () => {
    setContracts(loadData("contracts", []))
  }

  const handleDelete = (contract: Contract) => {
    const updatedContracts = contracts.filter((c) => c.id !== contract.id)
    saveData("contracts", updatedContracts)
    setContracts(updatedContracts)
    setDeletingContract(null)
  }

  const handleEditSuccess = () => {
    setEditingContract(null)
    handleRefresh()
  }

  const getUserName = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId)
    return foundUser ? foundUser.name : "Unassigned"
  }

  // Filter contracts based on user role
  const filteredContracts =
    user?.role === "owner"
      ? contracts
      : contracts.filter((contract) => contract.assignedTo === user?.id || contract.createdBy === user?.id)

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No contracts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.status === "Active"
                          ? "default"
                          : contract.status === "Pending"
                            ? "secondary"
                            : contract.status === "Draft"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatContractDate(contract.startDate)}</TableCell>
                  <TableCell>{formatContractDate(contract.endDate)}</TableCell>
                  <TableCell>{getUserName(contract.assignedTo || "")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingContract(contract)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingContract(contract)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit contract
                        </DropdownMenuItem>
                        {contract.fileUrl && (
                          <DropdownMenuItem onClick={() => window.open(contract.fileUrl, "_blank")}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingContract(contract)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete contract
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Contract Dialog */}
      {viewingContract && (
        <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{viewingContract.name}</DialogTitle>
              <DialogDescription>Contract details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <p>
                    <Badge
                      variant={
                        viewingContract.status === "Active"
                          ? "default"
                          : viewingContract.status === "Pending"
                            ? "secondary"
                            : viewingContract.status === "Draft"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {viewingContract.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Assigned To</h4>
                  <p>{getUserName(viewingContract.assignedTo || "")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Start Date</h4>
                  <p className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {formatContractDate(viewingContract.startDate)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">End Date</h4>
                  <p className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {formatContractDate(viewingContract.endDate)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Description</h4>
                <p className="whitespace-pre-wrap">{viewingContract.description || "No description provided."}</p>
              </div>

              {viewingContract.fileName && (
                <div>
                  <h4 className="text-sm font-medium">Attached Document</h4>
                  <p className="flex items-center">
                    <a
                      href={viewingContract.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingContract.fileName}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Contract Dialog */}
      {editingContract && (
        <Dialog open={!!editingContract} onOpenChange={() => setEditingContract(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Contract</DialogTitle>
              <DialogDescription>Update the contract details.</DialogDescription>
            </DialogHeader>
            <ContractForm onSuccess={handleEditSuccess} initialData={editingContract} isEditing={true} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingContract} onOpenChange={() => setDeletingContract(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contract "{deletingContract?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContract && handleDelete(deletingContract)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
