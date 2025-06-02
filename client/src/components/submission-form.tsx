import { useState } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Shield, LoaderPinwheel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { encryptData } from "@/lib/encryption";
import FileUpload from "@/components/file-upload";
import HospitalSelector from "@/components/hospital-selector";
import { NHS_HOSPITALS } from "@/data/nhs-hospitals";

const submissionSchema = z.object({
  hospital: z.string().min(1, "Please select your NHS hospital/trust").refine(
    (val) => NHS_HOSPITALS.includes(val as any),
    "Please select a valid NHS hospital from the list"
  ),
  category: z.string().min(1, "Please select a category for your report"),
  reportType: z.string().min(1, "Please specify the type of safety concern"),
  evidenceType: z.string().min(1, "Please specify what evidence supports this report"),
  eventDate: z.string().min(1, "Please provide the date when the incident occurred").refine(
    (val) => !isNaN(Date.parse(val)),
    "Please provide a valid date"
  ),
  eventTime: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters"),
  replyEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  consentSubmission: z.boolean().refine((val) => val === true, {
    message: "You must consent to submit",
  }),
  consentGdpr: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the privacy policy",
  }),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface SubmissionFormProps {
  onSuccess: () => void;
}

export default function SubmissionForm({ onSuccess }: SubmissionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptedFile, setEncryptedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      hospital: "",
      category: "",
      eventDate: "",
      eventTime: "",
      message: "",
      replyEmail: "",
      consentSubmission: false,
      consentGdpr: false,
    },
    mode: "onBlur",
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: {
      encryptedMessage: string;
      encryptedFile: string | null;
      replyEmail: string | null;
      hospitalTrust: string | null;
      category: string;
      eventDate: string;
      eventTime: string | null;
      sha256Hash: string;
    }) => {
      const response = await apiRequest("POST", "/api/submit", payload);
      return response.json();
    },
    onSuccess: () => {
      form.reset();
      setSelectedFile(null);
      setEncryptedFile(null);
      onSuccess();
    },
    onError: (error) => {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      // Encrypt the message
      const encryptedMessage = await encryptData(data.message);
      
      // Create submission payload
      const payload = {
        encryptedMessage,
        encryptedFile,
        replyEmail: data.replyEmail || null,
        hospitalTrust: data.hospital || null,
        category: data.category,
        eventDate: data.eventDate,
        eventTime: data.eventTime || null,
        sha256Hash: "", // Will be generated on server
      };

      submitMutation.mutate(payload);
    } catch (error) {
      toast({
        title: "Encryption Failed",
        description: "Unable to encrypt your submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileProcessed = (file: File, encryptedData: string) => {
    setSelectedFile(file);
    setEncryptedFile(encryptedData);
  };

  const handleFileRemoved = () => {
    setSelectedFile(null);
    setEncryptedFile(null);
  };

  const messageLength = form.watch("message")?.length || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hospital Selection */}
        <FormField
          control={form.control}
          name="hospital"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <HospitalSelector
                  value={field.value}
                  onValueChange={field.onChange}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Selection */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Report Category <span className="text-error">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md">
                    <SelectValue placeholder="Select the type of concern you're reporting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient_safety">Patient Safety - Immediate Risk</SelectItem>
                    <SelectItem value="clinical_governance">Clinical Governance - Systemic Issues</SelectItem>
                    <SelectItem value="infection_control">Infection Control - Safety Protocol Breach</SelectItem>
                    <SelectItem value="medication_safety">Medication Safety - Drug Administration Error</SelectItem>
                    <SelectItem value="equipment_safety">Equipment Safety - Device Malfunction</SelectItem>
                    <SelectItem value="staffing_safety">Staffing Safety - Unsafe Ratios/Competency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Choose the category that best describes your concern
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Report Type */}
        <FormField
          control={form.control}
          name="reportType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Type of Safety Concern <span className="text-error">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md">
                    <SelectValue placeholder="Specify the nature of this safety concern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate_patient_risk">Immediate Patient Risk - Urgent Action Required</SelectItem>
                    <SelectItem value="recurring_pattern">Recurring Pattern - Multiple Similar Incidents</SelectItem>
                    <SelectItem value="systemic_failure">Systemic Failure - Process/Protocol Breakdown</SelectItem>
                    <SelectItem value="near_miss">Near Miss - Potential for Serious Harm</SelectItem>
                    <SelectItem value="policy_violation">Policy Violation - Safety Standards Not Met</SelectItem>
                    <SelectItem value="resource_constraint">Resource Constraint - Safety Compromised by Limitations</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                This helps determine the urgency and type of response needed
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Evidence Type */}
        <FormField
          control={form.control}
          name="evidenceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Evidence Supporting This Report <span className="text-error">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md">
                    <SelectValue placeholder="What evidence do you have for this concern?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct_witness">Direct Witness - I personally observed the incident</SelectItem>
                    <SelectItem value="documentation">Documentation - Written records/emails/policies support this</SelectItem>
                    <SelectItem value="multiple_sources">Multiple Sources - Several people have reported similar issues</SelectItem>
                    <SelectItem value="data_evidence">Data Evidence - Statistics/metrics show concerning patterns</SelectItem>
                    <SelectItem value="expert_opinion">Expert Opinion - Clinical professionals have raised concerns</SelectItem>
                    <SelectItem value="patient_feedback">Patient Feedback - Patients/families have reported issues</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Strong evidence helps ensure appropriate action and protects against unfounded claims
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Date */}
          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Date of Incident <span className="text-error">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md"
                  />
                </FormControl>
                <p className="text-xs text-gray-500 mt-1">
                  When did this incident occur?
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Time */}
          <FormField
            control={form.control}
            name="eventTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Time of Incident (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="time"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md"
                  />
                </FormControl>
                <p className="text-xs text-gray-500 mt-1">
                  Approximate time if known
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Message Input */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Your Message <span className="text-error">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="Describe your concern in detail. Minimum 10 characters required."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md"
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormMessage />
                <span className={`text-sm transition-all duration-300 ${
                  messageLength < 10 ? 'text-error animate-pulse' : 
                  messageLength > 4000 ? 'text-warning' : 
                  'text-gray-500'
                }`}>
                  {messageLength} / 5000
                </span>
              </div>
            </FormItem>
          )}
        />

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supporting Documents (Optional)
          </label>
          <FileUpload
            onFileProcessed={handleFileProcessed}
            onFileRemoved={handleFileRemoved}
            selectedFile={selectedFile}
          />
        </div>

        {/* Anonymous Reply Email */}
        <FormField
          control={form.control}
          name="replyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Anonymous Reply Email (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="your-alias@anonaddy.me (for anonymous replies only)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm focus:scale-[1.01] focus:shadow-md"
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Use an anonymous email forwarding service like AnonAddy for secure replies
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Consent Checkboxes */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="consentSubmission"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 group">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 h-4 w-4 transition-all duration-200 hover:scale-110 hover:shadow-md focus:scale-110 group-hover:animate-pulse"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-gray-700 cursor-pointer transition-colors duration-200 hover:text-primary">
                    I consent to submitting this patient safety report. I understand this report will undergo verification review before any action is taken. I confirm this report is made in good faith and is based on genuine safety concerns supported by evidence. <span className="text-error">*</span>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consentGdpr"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 group">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 h-4 w-4 transition-all duration-200 hover:scale-110 hover:shadow-md focus:scale-110 group-hover:animate-pulse"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-gray-700 cursor-pointer transition-colors duration-200 hover:text-primary">
                    I acknowledge that I have read and understand the{" "}
                    <a href="/privacy-policy" target="_blank" className="text-primary hover:underline transition-all duration-200 hover:scale-105">Privacy Policy</a> and{" "}
                    <a href="/terms-of-service" target="_blank" className="text-primary hover:underline transition-all duration-200 hover:scale-105">Terms of Service</a>. <span className="text-error">*</span>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? (
              <>
                <LoaderPinwheel className="w-4 h-4 mr-2 animate-spin" />
                Encrypting & Submitting...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Submit Securely
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
