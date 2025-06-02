import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NeonTextProps {
  children: React.ReactNode;
  className?: string;
  glowIntensity?: "low" | "medium" | "high";
  animated?: boolean;
}

export default function NeonText({ 
  children, 
  className = "", 
  glowIntensity = "medium",
  animated = true 
}: NeonTextProps) {
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      setIsSelected(selection ? selection.toString().length > 0 : false);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const glowVariants = {
    idle: {
      textShadow: [
        "0 0 5px rgba(59, 130, 246, 0.6)",
        "0 0 10px rgba(59, 130, 246, 0.4)",
        "0 0 15px rgba(59, 130, 246, 0.2)"
      ].join(", "),
      transition: { duration: 2, repeat: Infinity, repeatType: "reverse" as const }
    },
    selected: {
      textShadow: [
        "0 0 8px rgba(59, 130, 246, 1)",
        "0 0 16px rgba(59, 130, 246, 0.8)",
        "0 0 24px rgba(59, 130, 246, 0.6)",
        "0 0 32px rgba(59, 130, 246, 0.4)"
      ].join(", "),
      transition: { duration: 0.3 }
    }
  };

  const intensityMap = {
    low: "0.4",
    medium: "0.6", 
    high: "0.8"
  };

  return (
    <motion.div
      className={`neon-selection ${className}`}
      variants={animated ? glowVariants : undefined}
      animate={isSelected ? "selected" : "idle"}
      style={{
        filter: `drop-shadow(0 0 10px rgba(59, 130, 246, ${intensityMap[glowIntensity]}))`
      }}
    >
      {children}
    </motion.div>
  );
}