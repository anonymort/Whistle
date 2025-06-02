import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Scale, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Submission {
  id: number;
  category: string;
  reportType: string;
  evidenceType: string;
  verificationStatus: string;
  legalReviewStatus: string;
  riskLevel: string;
  submittedAt: Date;
  hospitalTrust: string;
}

interface LegalSafeguardsProps {
  submissions: Submission[];
  onUpdateVerification: (id: number, status: string) => void;
  onUpdateLegalReview: (id: number, status: string, notes: string) => void;
}

export default function LegalSafeguards({ 
  submissions, 
  onUpdateVerification, 
  onUpdateLegalReview 
}: LegalSafeguardsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [legalNotes, setLegalNotes] = useState("");

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'requires_review': return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
      case 'insufficient_evidence': return <Badge className="bg-red-100 text-red-800">Insufficient Evidence</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const getLegalReviewBadge = (status: string) => {
    switch (status) {
      case 'cleared': return <Badge className="bg-green-100 text-green-800">Cleared</Badge>;
      case 'requires_legal_review': return <Badge className="bg-orange-100 text-orange-800">Legal Review Required</Badge>;
      case 'defamation_risk': return <Badge className="bg-red-100 text-red-800">Defamation Risk</Badge>;
      case 'privacy_concern': return <Badge className="bg-purple-100 text-purple-800">Privacy Concern</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Not Required</Badge>;
    }
  };

  const getRiskLevel = (submission: Submission) => {
    let riskScore = 0;
    
    // Evidence strength assessment
    if (submission.evidenceType === 'direct_witness') riskScore += 1;
    else if (submission.evidenceType === 'documentation') riskScore += 2;
    else if (submission.evidenceType === 'multiple_sources') riskScore += 3;
    else riskScore -= 1;

    // Category risk assessment
    if (submission.category === 'patient_safety') riskScore += 2;
    else if (submission.category === 'clinical_governance') riskScore += 1;

    // Report type assessment
    if (submission.reportType === 'immediate_patient_risk') riskScore += 3;
    else if (submission.reportType === 'systemic_failure') riskScore += 2;

    return riskScore >= 4 ? 'low_risk' : riskScore >= 2 ? 'medium_risk' : 'high_risk';
  };

  const prioritySubmissions = submissions.filter(s => 
    s.verificationStatus === 'requires_review' || 
    s.legalReviewStatus === 'requires_legal_review'
  );

  const highRiskSubmissions = submissions.filter(s => getRiskLevel(s) === 'high_risk');

  return (
    <div className="space-y-6">
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.verificationStatus === 'pending').length}
            </div>
            <p className="text-xs text-gray-600">Awaiting evidence review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legal Review Required</CardTitle>
            <Scale className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.legalReviewStatus === 'requires_legal_review').length}
            </div>
            <p className="text-xs text-gray-600">Potential legal considerations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Reports</CardTitle>
            <Eye className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {highRiskSubmissions.length}
            </div>
            <p className="text-xs text-gray-600">Require careful handling</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verification">Evidence Verification</TabsTrigger>
          <TabsTrigger value="legal">Legal Review</TabsTrigger>
          <TabsTrigger value="guidelines">Safety Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Verification Queue</CardTitle>
              <CardDescription>
                Review evidence strength and credibility before escalation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.filter(s => s.verificationStatus === 'pending').map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Report #{submission.id}</h4>
                        <p className="text-sm text-gray-600">{submission.hospitalTrust}</p>
                        <p className="text-sm text-gray-500">
                          {submission.category} • {submission.reportType}
                        </p>
                      </div>
                      {getVerificationBadge(submission.verificationStatus)}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Evidence Type:</span> {submission.evidenceType}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Select onValueChange={(value) => onUpdateVerification(submission.id, value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Update verification status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified - Strong Evidence</SelectItem>
                          <SelectItem value="requires_review">Requires Further Review</SelectItem>
                          <SelectItem value="insufficient_evidence">Insufficient Evidence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legal Risk Assessment</CardTitle>
              <CardDescription>
                Evaluate potential legal implications before public action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.filter(s => 
                  s.verificationStatus === 'verified' && 
                  s.legalReviewStatus !== 'cleared'
                ).map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Report #{submission.id}</h4>
                        <p className="text-sm text-gray-600">{submission.hospitalTrust}</p>
                        <div className="flex space-x-2 mt-1">
                          {getVerificationBadge(submission.verificationStatus)}
                          {getLegalReviewBadge(submission.legalReviewStatus)}
                        </div>
                      </div>
                      <Badge variant={getRiskLevel(submission) === 'high_risk' ? 'destructive' : 'secondary'}>
                        {getRiskLevel(submission).replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`legal-notes-${submission.id}`}>Legal Review Notes</Label>
                      <Textarea
                        id={`legal-notes-${submission.id}`}
                        placeholder="Document legal considerations, defamation risks, privacy concerns..."
                        value={selectedSubmission === submission.id ? legalNotes : ''}
                        onChange={(e) => {
                          setSelectedSubmission(submission.id);
                          setLegalNotes(e.target.value);
                        }}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Select onValueChange={(value) => onUpdateLegalReview(submission.id, value, legalNotes)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Legal review status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleared">Cleared for Action</SelectItem>
                          <SelectItem value="requires_legal_review">Requires Legal Review</SelectItem>
                          <SelectItem value="defamation_risk">Defamation Risk Identified</SelectItem>
                          <SelectItem value="privacy_concern">Privacy Concern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legal Protection Guidelines</CardTitle>
              <CardDescription>
                Framework for safe reporting and escalation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-700">Safe to Escalate</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Strong evidence (documentation, multiple sources)</li>
                    <li>• Immediate patient safety risk</li>
                    <li>• Systemic pattern with data support</li>
                    <li>• Legal review cleared</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-700">Requires Caution</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Single source reports</li>
                    <li>• Named individuals without strong evidence</li>
                    <li>• Historical incidents without current relevance</li>
                    <li>• Management or HR disputes</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-700">High Risk - Avoid Escalation</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Personal grievances without safety impact</li>
                    <li>• Unsubstantiated allegations against individuals</li>
                    <li>• Potential defamation without public interest defense</li>
                    <li>• Breaches of confidentiality without clear safety benefit</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Recommended Escalation Process</h4>
                <ol className="text-sm text-blue-600 space-y-1">
                  <li>1. Evidence verification and source assessment</li>
                  <li>2. Legal review for defamation and privacy risks</li>
                  <li>3. Anonymous contact with trust (where appropriate)</li>
                  <li>4. Regulatory notification (CQC/HSSIB)</li>
                  <li>5. Public disclosure (only with legal clearance)</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}