import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OnboardingList } from "@/components/dashboard/onboarding-list"
import { PlusCircle } from "lucide-react"

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground">Manage client and employee onboarding.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Onboarding
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Processes</CardTitle>
          <CardDescription>View and manage all your onboarding processes.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingList />
        </CardContent>
      </Card>
    </div>
  )
}
