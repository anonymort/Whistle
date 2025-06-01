import { Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-white w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Submission Successful</h3>
          <p className="text-gray-600 mb-6">
            Your report has been encrypted and submitted securely. Thank you for speaking up.
          </p>
          <Button 
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
