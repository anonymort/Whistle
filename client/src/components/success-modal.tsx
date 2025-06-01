import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-xl font-semibold text-gray-900 text-center">
          Submission Successful
        </DialogTitle>
        <DialogDescription className="text-center">
          Your report has been encrypted and submitted securely.
        </DialogDescription>
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-white w-8 h-8" />
          </div>
          <p className="text-gray-600 mb-6">
            Thank you for speaking up. Your submission is protected by end-to-end encryption.
          </p>
          <Button 
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
