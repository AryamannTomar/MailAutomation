import { CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-green-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <Card className="shadow-lg border border-green-200 bg-white">
          <CardHeader className="text-center bg-green-100 border-b border-green-200">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-900">
              Form Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-green-700 text-lg">
              Your contract data has been successfully sent to the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="text-gray-600">
                <p className="mb-4">
                  Thank you for submitting your contract information. The data has been processed and sent to the appropriate recipients.
                </p>
                <p className="text-sm text-gray-500">
                  You will receive a confirmation email shortly with the details of your submission.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Submit Another Form
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 