import { Shield, Users, FileText, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">WhistleLite</h1>
                <p className="text-sm text-gray-600">NHS Whistleblowing Portal</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Critical Gap in NHS Safety Reporting
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Why WhistleLite Fills a Necessary Gap
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The NHS already uses incident reporting systems like Datix, but these have long-standing 
            limitations that prevent effective safety reporting and whistleblowing.
          </p>
        </div>

        {/* Problem vs Solution */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How We Fill the Gap</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problems */}
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-6 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Problems in Existing Systems
              </h3>
              <div className="space-y-4">
                <Card className="border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Fear of Reprisal</h4>
                        <p className="text-sm text-gray-600">Identifiable reporters may fear reprisal or blame</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Report Suppression</h4>
                        <p className="text-sm text-gray-600">Reports can be suppressed, lost, or redirected internally</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">No Follow-up Capability</h4>
                        <p className="text-sm text-gray-600">No ability to follow up with anonymous reporters</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Delayed Responses</h4>
                        <p className="text-sm text-gray-600">Bureaucratic or delayed responses to critical safety issues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                How WhistleLite Solves This
              </h3>
              <div className="space-y-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">True Anonymity</h4>
                        <p className="text-sm text-gray-600">Offers genuine anonymity, not just 'confidentiality'</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">External Independence</h4>
                        <p className="text-sm text-gray-600">Hosted outside Trust control, creating a safe fallback when local systems fail</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Two-way Communication</h4>
                        <p className="text-sm text-gray-600">Allows anonymous follow-up using secure email forwarding</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Visibility & Accountability</h4>
                        <p className="text-sm text-gray-600">Facilitates quarterly public/regulator summaries to force visibility</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Broader Need Section */}
        <div className="bg-blue-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">The Broader Need</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 mb-6">
              Numerous high-profile NHS scandals have exposed systemic failures to act on staff concerns:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <Badge variant="destructive" className="justify-center p-2">Mid Staffs</Badge>
              <Badge variant="destructive" className="justify-center p-2">Lucy Letby</Badge>
              <Badge variant="destructive" className="justify-center p-2">Gosport</Badge>
              <Badge variant="destructive" className="justify-center p-2">East Kent</Badge>
              <Badge variant="destructive" className="justify-center p-2">Shrewsbury</Badge>
              <Badge variant="destructive" className="justify-center p-2">Birmingham</Badge>
            </div>
            <p className="text-lg text-gray-700">
              Frontline staff often know something is wrong but face cultural and procedural barriers 
              to raising the alarm effectively. WhistleLite acts as a <strong>"dead man's switch"</strong> for 
              safety concerns—ensuring that, even if the Trust takes no action, someone will.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Modern Solution Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">No NHS Login</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit reports without any NHS credentials or identifiable information
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Zero Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Client-side metadata stripping ensures complete privacy protection
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">File Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built-in file upload with end-to-end encryption for sensitive documents
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle className="text-lg">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Anonymous audit trail ensures reports are properly dispatched and tracked
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Report Safely?</h2>
          <p className="text-xl mb-6 opacity-90">
            Your voice matters. Report concerns with complete anonymity and security.
          </p>
          <Link href="/">
            <Button size="lg" variant="secondary">
              <Shield className="w-5 h-5 mr-2" />
              Start Anonymous Report
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">WhistleLite</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Secure, anonymous whistleblowing for NHS safety concerns
          </p>
          <p className="text-xs text-gray-500">
            GDPR compliant • End-to-end encrypted • 90-day automatic deletion
          </p>
        </div>
      </footer>
    </div>
  );
}