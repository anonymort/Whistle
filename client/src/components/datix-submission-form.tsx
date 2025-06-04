import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { submitData } from "@/lib/queryClient";
import { Shield, FileText, AlertTriangle, User, MapPin, Clock } from "lucide-react";

const submissionSchema = z.object({
  // Identity Section (Optional but recommended)
  contactMethod: z.enum(["anonymous", "email", "anonymous_reply"]).default("anonymous"),
  reporterName: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  staffId: z.string().optional(),
  replyEmail: z.string().email().optional().or(z.literal("")),
  reporterRelationship: z.enum(["involved", "witness", "second_hand"]).optional(),
  
  // Incident Details
  incidentDescription: z.string().min(10, "Please provide detailed description (minimum 10 characters)"),
  hospitalTrust: z.string().min(1, "Hospital/Trust is required"),
  incidentLocation: z.string().min(1, "Incident location is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  
  // Classification
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  reportType: z.string().min(1, "Report type is required"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  patientSafetyImpact: z.enum(["none", "potential", "actual", "severe"]).default("none"),
  
  // Evidence and Witnesses
  evidenceType: z.string().optional(),
  evidenceFile: z.any().optional(),
  witnessesPresent: z.boolean().default(false),
  witnessDetails: z.string().optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface DatixSubmissionFormProps {
  onSuccess: () => void;
}

export default function DatixSubmissionForm({ onSuccess }: DatixSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIdentityFields, setShowIdentityFields] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      contactMethod: "anonymous",
      riskLevel: "medium",
      patientSafetyImpact: "none",
      witnessesPresent: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      // Prepare submission data for encryption
      const submissionData = {
        encryptedMessage: data.incidentDescription,
        contactMethod: data.contactMethod,
        encryptedContactDetails: data.replyEmail || null,
        remainsAnonymous: data.contactMethod === "anonymous" ? "true" : "false",
        encryptedReporterName: data.reporterName || null,
        encryptedJobTitle: data.jobTitle || null,
        encryptedDepartment: data.department || null,
        encryptedStaffId: data.staffId || null,
        reporterRelationship: data.reporterRelationship || null,
        hospitalTrust: data.hospitalTrust,
        incidentLocation: data.incidentLocation,
        eventDate: data.eventDate,
        eventTime: data.eventTime || null,
        category: data.category,
        subcategory: data.subcategory || null,
        reportType: data.reportType,
        riskLevel: data.riskLevel,
        patientSafetyImpact: data.patientSafetyImpact,
        evidenceType: data.evidenceType || null,
        witnessesPresent: data.witnessesPresent ? "true" : "false",
        encryptedWitnessDetails: data.witnessDetails || null,
      };
      
      return submitData('/api/submissions', submissionData);
    },
    onSuccess: (response: any) => {
      const successMessage = response?.anonymousReplyEmail 
        ? `Your incident report has been submitted securely. For anonymous updates, use: ${response.anonymousReplyEmail}`
        : "Your incident report has been submitted securely and anonymously.";
      
      toast({
        title: "Submission Successful",
        description: successMessage,
        duration: 8000,
      });
      form.reset();
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SubmissionFormData) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethod = form.watch("contactMethod");
  const witnessesPresent = form.watch("witnessesPresent");

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Contact Preference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Contact Preference</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How would you like to receive updates?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="anonymous" id="anonymous" />
                          <label htmlFor="anonymous" className="text-sm">
                            Remain completely anonymous (no updates)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email" />
                          <label htmlFor="email" className="text-sm">
                            Provide email for direct updates
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="anonymous_reply" id="anonymous_reply" />
                          <label htmlFor="anonymous_reply" className="text-sm">
                            Use anonymous reply service (maintains privacy)
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {contactMethod === "email" && (
                <FormField
                  control={form.control}
                  name="replyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your.email@nhs.uk"
                          className="w-full"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        This will be encrypted before storage
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Reporter Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Reporter Information</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIdentityFields(!showIdentityFields)}
                >
                  {showIdentityFields ? "Hide" : "Show"} Identity Fields
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showIdentityFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reporterName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Dr. Jane Smith"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Senior Nurse, Consultant, etc."
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department/Ward (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Emergency Department, ICU, etc."
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff ID (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Employee/Staff ID Number"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="reporterRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your relationship to this incident</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="involved">I was directly involved</SelectItem>
                        <SelectItem value="witness">I witnessed the incident</SelectItem>
                        <SelectItem value="second_hand">I heard about it from others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Incident Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="incidentDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description of Incident</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Please describe what happened, when, where, and who was involved. Include as much detail as possible to help with investigation."
                        className="min-h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hospitalTrust"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital/NHS Trust</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Trust" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leeds-teaching">Leeds Teaching Hospitals NHS Trust</SelectItem>
                          <SelectItem value="manchester-foundation">Manchester University NHS Foundation Trust</SelectItem>
                          <SelectItem value="imperial-college">Imperial College Healthcare NHS Trust</SelectItem>
                          <SelectItem value="guys-thomas">Guy's and St Thomas' NHS Foundation Trust</SelectItem>
                          <SelectItem value="other">Other (please specify in description)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Location</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ward name, department, room number"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Incident</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Incident (if known)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Incident Classification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="patient-safety">Patient Safety Incident</SelectItem>
                          <SelectItem value="medication-error">Medication Error</SelectItem>
                          <SelectItem value="clinical-negligence">Clinical Negligence</SelectItem>
                          <SelectItem value="bullying-harassment">Bullying & Harassment</SelectItem>
                          <SelectItem value="financial-misconduct">Financial Misconduct</SelectItem>
                          <SelectItem value="data-breach">Data Protection Breach</SelectItem>
                          <SelectItem value="infection-control">Infection Control</SelectItem>
                          <SelectItem value="staffing-concerns">Staffing Concerns</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Report</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="incident">Incident Report</SelectItem>
                          <SelectItem value="near-miss">Near Miss</SelectItem>
                          <SelectItem value="concern">General Concern</SelectItem>
                          <SelectItem value="complaint">Formal Complaint</SelectItem>
                          <SelectItem value="whistleblowing">Whistleblowing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                          <SelectItem value="critical">Critical Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientSafetyImpact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Safety Impact</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select impact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Patient Impact</SelectItem>
                          <SelectItem value="potential">Potential for Harm</SelectItem>
                          <SelectItem value="actual">Actual Harm Occurred</SelectItem>
                          <SelectItem value="severe">Severe Harm/Death</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Evidence and Witnesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Evidence & Witnesses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="evidenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Evidence (if any)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select evidence type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Evidence</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="photos">Photographs</SelectItem>
                        <SelectItem value="emails">Email Communications</SelectItem>
                        <SelectItem value="audio">Audio Recording</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="witnessesPresent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Were there witnesses to this incident?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {witnessesPresent && (
                <FormField
                  control={form.control}
                  name="witnessDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Details (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Names, job titles, departments of witnesses (if you're comfortable providing this information)"
                          className="min-h-20"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        This information will be encrypted before storage
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Security & Privacy</h4>
                  <p className="text-sm text-blue-700">
                    Your submission will be encrypted on your device before transmission. 
                    All identifying information is optional and will be securely encrypted if provided.
                    Reports are automatically deleted after 6 months unless ongoing correspondence is required.
                  </p>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? "Submitting Securely..." : "Submit Incident Report"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}