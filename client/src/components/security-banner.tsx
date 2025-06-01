import { Lock } from "lucide-react";

export default function SecurityBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
      <div className="flex items-start space-x-3">
        <Lock className="text-primary w-5 h-5 mt-0.5" />
        <div>
          <h3 className="font-semibold text-primary mb-1">End-to-End Encrypted</h3>
          <p className="text-sm text-blue-700">
            Your submission is encrypted in your browser before transmission. Only authorized NHS administrators can decrypt messages for investigation purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
