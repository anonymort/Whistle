import { useState, useEffect } from "react";
import { Settings, Volume2, VolumeX, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface AccessibilitySettingsProps {
  onVoiceToggle?: (enabled: boolean) => void;
  onHighContrastToggle?: (enabled: boolean) => void;
}

export default function AccessibilitySettings({ 
  onVoiceToggle, 
  onHighContrastToggle 
}: AccessibilitySettingsProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }

    // Load settings from localStorage
    const savedVoiceEnabled = localStorage.getItem('accessibility-voice') === 'true';
    const savedHighContrast = localStorage.getItem('accessibility-high-contrast') === 'true';
    
    setVoiceEnabled(savedVoiceEnabled);
    setHighContrastEnabled(savedHighContrast);

    // Apply high contrast mode if enabled
    if (savedHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    // Notify parent components
    if (onVoiceToggle) onVoiceToggle(savedVoiceEnabled);
    if (onHighContrastToggle) onHighContrastToggle(savedHighContrast);
  }, []);

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    localStorage.setItem('accessibility-voice', enabled.toString());
    
    if (onVoiceToggle) {
      onVoiceToggle(enabled);
    }

    // Stop any current speech
    if (speechSynthesis && !enabled) {
      speechSynthesis.cancel();
    }

    // Announce the change
    if (speechSynthesis && enabled) {
      const utterance = new SpeechSynthesisUtterance("Voice assistance enabled. Page content will now be read aloud.");
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const handleHighContrastToggle = (enabled: boolean) => {
    setHighContrastEnabled(enabled);
    localStorage.setItem('accessibility-high-contrast', enabled.toString());
    
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (onHighContrastToggle) {
      onHighContrastToggle(enabled);
    }

    // Announce the change if voice is enabled
    if (speechSynthesis && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(
        enabled ? "High contrast mode enabled" : "High contrast mode disabled"
      );
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const speakText = (text: string) => {
    if (speechSynthesis && voiceEnabled) {
      speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  // Export function for other components to use
  useEffect(() => {
    (window as any).speakText = speakText;
    return () => {
      delete (window as any).speakText;
    };
  }, [voiceEnabled, speechSynthesis]);

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            aria-label="Accessibility settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Accessibility Settings</h4>
            </div>

            <Separator />

            {/* Voice Assistance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-blue-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <Label htmlFor="voice-assistance" className="text-sm font-medium">
                    Voice Assistance
                  </Label>
                </div>
                <Switch
                  id="voice-assistance"
                  checked={voiceEnabled}
                  onCheckedChange={handleVoiceToggle}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Read page content and form labels aloud
              </p>
            </div>

            <Separator />

            {/* High Contrast Mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {highContrastEnabled ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  <Label htmlFor="high-contrast" className="text-sm font-medium">
                    High Contrast
                  </Label>
                </div>
                <Switch
                  id="high-contrast"
                  checked={highContrastEnabled}
                  onCheckedChange={handleHighContrastToggle}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>

            {voiceEnabled && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => speakText("This is the NHS WhistleLite anonymous reporting portal. Use this secure platform to report safety concerns confidentially.")}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Test Voice
                  </Button>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>


    </>
  );
}