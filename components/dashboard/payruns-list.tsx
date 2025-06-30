import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Download } from "lucide-react"

export function PayrunsList() {
  const payruns = [
    {
      id: "PR-001",
      name: "April 2025 Payrun",
      amount: "$12,450.00",
      status: "Completed",
      date: "Apr 30, 2025",
      invoices: 8,
    },
    {
      id: "PR-002",
      name: "March 2025 Payrun",
      amount: "$10,850.00",
      status: "Completed",
      date: "Mar 31, 2025",
      invoices: 7,
    },
    {
      id: "PR-003",
      name: "February 2025 Payrun",
      amount: "$9,750.00",
      status: "Completed",
      date: "Feb 28, 2025",
      invoices: 6,
    },
    {
      id: "PR-004",
      name: "January 2025 Payrun",
      amount: "$8,200.00",
      status: "Completed",
      date: "Jan 31, 2025",
      invoices: 5,
    },
    {
      id: "PR-005",
      name: "May 2025 Payrun",
      amount: "$0.00",
      status: "Pending",
      date: "May 31, 2025",
      invoices: 0,
    },
  ]

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payrun ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payruns.map((payrun) => (
              <TableRow key={payrun.id}>
                <TableCell className="font-medium">{payrun.id}</TableCell>
                <TableCell>{payrun.name}</TableCell>
                <TableCell>{payrun.amount}</TableCell>
                <TableCell>
                  <Badge variant={payrun.status === "Completed" ? "default" : "secondary"}>{payrun.status}</Badge>
                </TableCell>
                <TableCell>{payrun.date}</TableCell>
                <TableCell>{payrun.invoices}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
