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
                    I consent to submitting this anonymous report. I understand that my submission will be encrypted and stored securely for up to 90 days. <span className="text-error">*</span>
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
                    <a href="#" className="text-primary hover:underline transition-all duration-200 hover:scale-105">Privacy Policy</a> and{" "}
                    <a href="#" className="text-primary hover:underline transition-all duration-200 hover:scale-105">Data Retention Policy</a>. <span className="text-error">*</span>
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
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 hover:scale-[1.02] hover:shadow-lg focus:ring-4 focus:ring-blue-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none group"
          >
            {submitMutation.isPending ? (
              <>
                <LoaderPinwheel className="w-4 h-4 mr-2 animate-spin" />
                <span className="animate-pulse">Encrypting & Submitting...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                Submit Securely
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
