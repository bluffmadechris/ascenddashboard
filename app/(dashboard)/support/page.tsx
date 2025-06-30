import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HelpCircle, Mail, MessageSquare, Phone } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground">Get help with your account or contact our support team.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Fill out the form below to get in touch with our support team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="What's your issue about?" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Please describe your issue in detail..." className="min-h-[120px]" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Send message
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions about our platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">How do I reset my password?</h3>
                <p className="text-sm text-muted-foreground">
                  You can reset your password by clicking on the "Forgot password" link on the login page.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">How do I create a new invoice?</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate to the Invoices page and click on the "New Invoice" button in the top right corner.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Can I export my data?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can export your data from the Account Settings page under the "Data" tab.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <HelpCircle className="mr-2 h-4 w-4" />
                View all FAQs
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Reach out to us directly using the information below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>support@ascendmedia.com</span>
              </div>

              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>+1 (555) 123-4567</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Our support team is available Monday through Friday, 9am to 5pm EST.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
