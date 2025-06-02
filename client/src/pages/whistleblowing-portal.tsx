import { useState } from "react";
import { Shield, Lock, Clock, File, Scale3d, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SubmissionForm from "@/components/submission-form";
import SecurityBanner from "@/components/security-banner";
import SuccessModal from "@/components/success-modal";

export default function WhistleblowingPortal() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmissionSuccess = () => {
    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Whistle</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">DAUK Secure Anonymous Reporting Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/about">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  About
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Security Banner */}
        <SecurityBanner />

        {/* Submission Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Submit Anonymous Report</h2>
            <p className="text-gray-600">Report concerns safely and anonymously. All data is encrypted and automatically deleted after 90 days.</p>
          </div>

          <SubmissionForm onSuccess={handleSubmissionSuccess} />
        </div>

        {/* Security Info Cards */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <KeyRound className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-gray-900">Complete Anonymity</h3>
            </div>
            <p className="text-sm text-gray-600">Your identity remains protected through encryption. Rate limiting may temporarily store IP addresses for abuse prevention.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-gray-900">Auto-Delete</h3>
            </div>
            <p className="text-sm text-gray-600">All submissions are automatically deleted after 90 days in compliance with GDPR.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <File className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-gray-900">Metadata Stripped</h3>
            </div>
            <p className="text-sm text-gray-600">File metadata and EXIF data are automatically removed before encryption.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Scale3d className="text-primary w-5 h-5" />
              <h3 className="font-semibold text-gray-900">GDPR Compliant</h3>
            </div>
            <p className="text-sm text-gray-600">Fully compliant with NHS governance and GDPR data protection regulations.</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; 2024 DAUK Whistle Portal. Built with privacy and security by design.</p>
          <div className="mt-2 space-x-4">
            <a href="/privacy-policy" className="hover:text-primary transition-colors duration-200">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-primary transition-colors duration-200">Terms of Service</a>
            <a href="/contact" className="hover:text-primary transition-colors duration-200">Contact Support</a>
            <a href="/admin" className="hover:text-primary transition-colors duration-200">Admin Dashboard</a>
          </div>
        </footer>
      </main>

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
    </div>
  );
}
