import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { submitData } from "@/lib/queryClient";
import { encryptData, encryptFile, initializeEncryption, isEncryptionReady } from "@/lib/encryption";
import { NHSHospitalSearch } from "@/components/nhs-hospital-search";
import { getHospitalByName } from "@/data/nhs-hospitals";
import { Shield, FileText, AlertTriangle, User, MapPin, Clock, Lock } from "lucide-react";

// Simplified schema that matches database structure
const submissionSchema = z.object({
  // Contact method
  contactMethod: z.enum(["anonymous", "email", "anonymous_reply"]),
  
  // Core incident data
  incidentDescription: z.string().min(10, "Please provide detailed description (minimum 10 characters)"),
  hospitalTrust: z.string().min(1, "NHS Hospital/Trust is required").refine((value) => {
    return getHospitalByName(value) !== undefined;
  }, "Please select a valid NHS hospital or trust from the list"),
  incidentLocation: z.string().min(1, "Incident location is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  
  // Classification
  category: z.string().min(1, "Category is required"),
  reportType: z.string().min(1, "Report type is required"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  patientSafetyImpact: z.enum(["none", "potential", "actual", "severe"]),
  
  // Evidence
  evidenceType: z.enum(["none", "document", "photo", "video", "audio", "other"]),
  witnessesPresent: z.boolean(),
  witnessDetails: z.string().optional(),
  
  // Reporter info (conditional based on contact method)
  reporterName: z.string().optional(),
  reporterEmail: z.string().email().optional(),
  reporterJobTitle: z.string().optional(),
  reporterDepartment: z.string().optional(),
  reporterStaffId: z.string().optional(),
  relationshipToIncident: z.enum(["involved", "witness", "second_hand"]),
  contactDetails: z.string().optional(),
  
  // File upload
  file: z.instanceof(File).optional(),
  
  // Consent
  gdprAcknowledgment: z.boolean().refine((val) => val === true, "GDPR acknowledgment is required"),
  submissionAccuracy: z.boolean().refine((val) => val === true, "Accuracy confirmation is required"),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface DatixSubmissionFormProps {
  onSuccess: () => void;
}

export default function DatixSubmissionForm({ onSuccess }: DatixSubmissionFormProps) {
  const [encryptionReady, setEncryptionReady] = useState(false);
  const { toast } = useToast();

  // Initialize encryption on component mount
  useEffect(() => {
    const initEncryption = async () => {
      try {
        await initializeEncryption();
        setEncryptionReady(true);
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
        toast({
          title: "Encryption Error",
          description: "Unable to initialize secure encryption. Please refresh and try again.",
          variant: "destructive",
        });
      }
    };

    initEncryption();
  }, [toast]);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      contactMethod: "email",
      riskLevel: "medium",
      patientSafetyImpact: "none",
      witnessesPresent: false,
      hospitalTrust: "",
      incidentLocation: "",
      eventDate: "",
      eventTime: "",
      incidentDescription: "",
      reporterName: "",
      reporterEmail: "",
      reporterJobTitle: "",
      reporterDepartment: "",
      reporterStaffId: "",
      relationshipToIncident: "involved",
      contactDetails: "",
      category: "patient_safety",
      reportType: "incident",
      evidenceType: "none",
      witnessDetails: "",
      gdprAcknowledgment: false,
      submissionAccuracy: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      if (!encryptionReady) {
        throw new Error('Encryption not ready. Please wait and try again.');
      }

      // Encrypt all sensitive data fields before submission
      const submissionData = {
        // Encrypt the incident description
        encryptedMessage: await encryptData(data.incidentDescription),
        
        // Contact method and anonymity settings (not encrypted)
        contactMethod: data.contactMethod,
        remainsAnonymous: data.contactMethod === "anonymous" ? "true" : "false",
        
        // Encrypt reporter identity data if provided
        encryptedReporterName: data.reporterName ? await encryptData(data.reporterName) : null,
        encryptedJobTitle: data.reporterJobTitle ? await encryptData(data.reporterJobTitle) : null,
        encryptedDepartment: data.reporterDepartment ? await encryptData(data.reporterDepartment) : null,
        encryptedStaffId: data.reporterStaffId ? await encryptData(data.reporterStaffId) : null,
        reporterRelationship: data.relationshipToIncident,
        
        // Encrypt contact details if provided
        encryptedContactDetails: data.contactDetails || data.reporterEmail ? 
          await encryptData(data.contactDetails || data.reporterEmail || "") : null,
        
        // Incident details (hospitalTrust not encrypted for admin filtering)
        hospitalTrust: data.hospitalTrust,
        incidentLocation: data.incidentLocation,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        
        // Classification fields (not encrypted for admin filtering)
        category: data.category,
        reportType: data.reportType,
        riskLevel: data.riskLevel,
        patientSafetyImpact: data.patientSafetyImpact,
        
        // Evidence fields
        evidenceType: data.evidenceType,
        witnessesPresent: data.witnessesPresent ? "true" : "false",
        encryptedWitnessDetails: data.witnessDetails ? await encryptData(data.witnessDetails) : null,
        
        // File handling
        encryptedFile: data.file ? await encryptFile(data.file) : null,
      };

      return await submitData("/api/submit", submissionData);
    },
    onSuccess: () => {
      toast({
        title: "Submission Successful",
        description: "Your report has been submitted securely and anonymously.",
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SubmissionFormData) => {
    if (!encryptionReady) {
      toast({
        title: "Encryption Not Ready",
        description: "Please wait for encryption to initialize.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(data);
  };

  if (!encryptionReady) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Lock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Initializing secure encryption...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Contact Preference</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How would you like to be contacted about this report?</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="anonymous" id="anonymous" />
                        <label htmlFor="anonymous">Anonymous (no contact)</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <label htmlFor="email">Email updates</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="anonymous_reply" id="anonymous_reply" />
                        <label htmlFor="anonymous_reply">Anonymous reply service</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="hospitalTrust"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NHS Hospital/Trust</FormLabel>
                    <NHSHospitalSearch
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search 736 authentic NHS hospitals..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Search authentic NHS hospitals and trusts. Selection restricted to verified NHS facilities only.
                    </p>
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

        {/* Reporter Identity (shown when not anonymous) */}
        {form.watch("contactMethod") !== "anonymous" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Reporter Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reporterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="your.email@nhs.net" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporterJobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Staff Nurse, Consultant" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporterDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department/Ward</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Emergency Department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporterStaffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff ID (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Staff identification number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relationshipToIncident"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship to Incident</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="involved">Directly involved</SelectItem>
                          <SelectItem value="witness">Witnessed the incident</SelectItem>
                          <SelectItem value="second_hand">Heard from others</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Classification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patient_safety">Patient Safety</SelectItem>
                        <SelectItem value="clinical_governance">Clinical Governance</SelectItem>
                        <SelectItem value="staff_conduct">Staff Conduct</SelectItem>
                        <SelectItem value="data_protection">Data Protection</SelectItem>
                        <SelectItem value="financial_irregularity">Financial Irregularity</SelectItem>
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
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="near_miss">Near Miss</SelectItem>
                        <SelectItem value="concern">Concern</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
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
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
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
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="potential">Potential</SelectItem>
                        <SelectItem value="actual">Actual</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* GDPR Consent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Data Protection & Consent</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="gdprAcknowledgment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I acknowledge that my data will be processed according to GDPR requirements
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Data will be encrypted, stored securely, and deleted after 6 months unless legal proceedings require retention.
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submissionAccuracy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that the information provided is accurate to the best of my knowledge
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={submitMutation.isPending}
          className="w-full"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Report Securely"}
        </Button>
      </form>
    </Form>
  );
}