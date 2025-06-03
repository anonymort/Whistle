import { Shield, Clock, FileText, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataGovernance() {
  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Data Governance & Retention</h1>
              <p className="text-xs sm:text-sm text-gray-600">GDPR Compliance & Privacy Protection</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Data Controller Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Data Controller</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Doctors' Association UK (DAUK)</h3>
              <p className="text-gray-600 mb-4">
                DAUK acts as the data controller for the WhistleLite anonymous reporting portal under UK GDPR. 
                We are committed to protecting whistleblowers' privacy and ensuring compliance with all data protection regulations.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Legal Basis for Processing</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Article 6(1)(f) GDPR - Legitimate interest in public health and patient safety</li>
                <li>• Article 9(2)(i) GDPR - Processing for public health purposes</li>
                <li>• Public Interest Disclosure Act 1998 compliance</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Data Retention Policy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Standard Retention</h4>
                <p className="text-sm text-green-800 mb-2">
                  <strong>6 months maximum</strong> for all submissions
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Automated deletion after 180 days</li>
                  <li>• No manual intervention required</li>
                  <li>• Complies with data minimization principles</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Extended Retention</h4>
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Extended only for ongoing correspondence</strong>
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Active investigation or legal proceedings</li>
                  <li>• Ongoing two-way communication</li>
                  <li>• Explicit consent from reporter</li>
                  <li>• Regular review and justification</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">What Gets Deleted</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-1">Personal Data</h5>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Encrypted messages and content</li>
                    <li>• Contact details (if provided)</li>
                    <li>• File attachments</li>
                    <li>• Case notes containing identifiers</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-1">Retained for Analysis</h5>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Anonymized statistical data</li>
                    <li>• Aggregated trend information</li>
                    <li>• Hospital trust patterns (non-identifying)</li>
                    <li>• Category and risk level distributions</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Protection Measures */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacy Protection Measures</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Technical Safeguards</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Client-side encryption before transmission</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">No IP address logging or tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">No persistent cookies or session storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Decryption keys held only by authorized reviewers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Automated secure deletion processes</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Operational Safeguards</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Access controls and role-based permissions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Comprehensive audit logging</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Regular security assessments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Staff training on data protection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Incident response procedures</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Your Data Protection Rights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Under UK GDPR, you have specific rights regarding your personal data. However, due to the anonymous nature 
                of this service, some rights may be limited to protect the anonymity that makes whistleblowing safe.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Available Rights</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Right to information</span>
                        <p className="text-xs text-gray-600">This page provides transparency about data processing</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Right to erasure</span>
                        <p className="text-xs text-gray-600">Automatic deletion after 6 months or on request</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Right to withdraw consent</span>
                        <p className="text-xs text-gray-600">Contact DAUK to withdraw consent for ongoing correspondence</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Limited for Anonymity</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Right of access</span>
                        <p className="text-xs text-gray-600">Limited due to anonymous submission design</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Right to rectification</span>
                        <p className="text-xs text-gray-600">Contact via anonymous reply service if applicable</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Right to portability</span>
                        <p className="text-xs text-gray-600">Not applicable to anonymous submissions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data Protection Officer</h4>
                <p className="text-sm text-gray-600 mb-2">
                  For any data protection queries or to exercise your rights:
                </p>
                <div className="text-sm text-gray-700">
                  <p>Email: dpo@dauk.org</p>
                  <p>Post: Data Protection Officer, DAUK, [Address]</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Regulatory Authority</h4>
                <p className="text-sm text-gray-600 mb-2">
                  You have the right to lodge a complaint with the supervisory authority:
                </p>
                <div className="text-sm text-gray-700">
                  <p>Information Commissioner's Office (ICO)</p>
                  <p>Website: ico.org.uk</p>
                  <p>Helpline: 0303 123 1113</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}