import { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface VoiceEnabledFormFieldProps {
  control: any;
  name: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  onFocus?: () => void;
}

export function VoiceEnabledFormField({ 
  control, 
  name, 
  label, 
  description, 
  children, 
  onFocus 
}: VoiceEnabledFormFieldProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    const checkVoiceEnabled = () => {
      const enabled = localStorage.getItem('accessibility-voice') === 'true';
      setVoiceEnabled(enabled);
    };

    checkVoiceEnabled();
    window.addEventListener('storage', checkVoiceEnabled);
    
    return () => {
      window.removeEventListener('storage', checkVoiceEnabled);
    };
  }, []);

  const speakText = (text: string) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFieldFocus = () => {
    if (voiceEnabled) {
      let textToSpeak = `${label} field.`;
      if (description) {
        textToSpeak += ` ${description}`;
      }
      speakText(textToSpeak);
    }
    if (onFocus) onFocus();
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-medium">{label}</FormLabel>
            {voiceEnabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  let textToSpeak = `${label} field.`;
                  if (description) {
                    textToSpeak += ` ${description}`;
                  }
                  if (fieldState.error) {
                    textToSpeak += ` Error: ${fieldState.error.message}`;
                  }
                  speakText(textToSpeak);
                }}
                className="p-1 h-auto"
                aria-label={`Read ${label} field information`}
              >
                <Volume2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          <FormControl>
            <div onFocus={handleFieldFocus}>
              {children}
            </div>
          </FormControl>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface VoiceEnabledSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function VoiceEnabledSection({ title, description, children }: VoiceEnabledSectionProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    const checkVoiceEnabled = () => {
      const enabled = localStorage.getItem('accessibility-voice') === 'true';
      setVoiceEnabled(enabled);
    };

    checkVoiceEnabled();
    window.addEventListener('storage', checkVoiceEnabled);
    
    return () => {
      window.removeEventListener('storage', checkVoiceEnabled);
    };
  }, []);

  const speakSection = () => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let textToSpeak = `Section: ${title}.`;
      if (description) {
        textToSpeak += ` ${description}`;
      }
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {voiceEnabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={speakSection}
            className="p-2"
            aria-label={`Read ${title} section`}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

// Hook for voice announcements
export function useVoiceAnnouncement() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    const checkVoiceEnabled = () => {
      const enabled = localStorage.getItem('accessibility-voice') === 'true';
      setVoiceEnabled(enabled);
    };

    checkVoiceEnabled();
    window.addEventListener('storage', checkVoiceEnabled);
    
    return () => {
      window.removeEventListener('storage', checkVoiceEnabled);
    };
  }, []);

  const announce = (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      if (priority === 'assertive') {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  return { announce, voiceEnabled };
}