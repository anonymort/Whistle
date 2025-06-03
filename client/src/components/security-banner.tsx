import { Lock } from "lucide-react";

export default function SecurityBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
      <div className="flex items-start space-x-3">
        <Lock className="text-primary w-5 h-5 mt-0.5" />
        <div>
          <h3 className="font-semibold text-primary mb-1">Anonymous by Default - Contact Optional</h3>
          <p className="text-sm text-blue-700">
            Default anonymous submission with no tracking. You can optionally provide contact details for updates. 
            All data encrypted on your device before transmission. DAUK acts as data controller under UK GDPR. 
            Decryption keys held only by authorized DAUK reviewers. Data automatically deleted after 6 months unless ongoing correspondence.
          </p>
        </div>
      </div>
    </div>
  );
}
