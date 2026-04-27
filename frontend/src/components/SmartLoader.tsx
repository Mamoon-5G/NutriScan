import { useState, useEffect } from "react";
import { ScanBarcode, Database, BrainCircuit, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const loadingSteps = [
  { id: 1, text: "Extracting product data...", icon: ScanBarcode },
  { id: 2, text: "Querying nutritional registries...", icon: Database },
  { id: 3, text: "Running ML health prediction...", icon: BrainCircuit },
  { id: 4, text: "Gemini generating alternatives...", icon: Sparkles }
];

export const SmartLoader = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2000); // 2 seconds per step fits typical API wait times
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <div className="relative h-20 w-20 flex items-center justify-center">
        {/* Outer glowing ring */}
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
        />
        
        {/* Inner pulsing circle */}
        <motion.div 
          animate={{ scale: [0.8, 1.1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-2 rounded-full bg-primary/10"
        />

        {/* Dynamic Icon */}
        <div className="relative z-10 text-primary">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.3 }}
            >
              {(() => {
                const Icon = loadingSteps[currentStep].icon;
                return <Icon size={28} strokeWidth={2.5} />;
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Animated Text Carousel */}
      <div className="h-8 relative w-72 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 text-center font-medium text-foreground tracking-wide"
          >
            {loadingSteps[currentStep].text}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Progress Dots */}
      <div className="flex gap-2">
        {loadingSteps.map((_, idx) => (
          <motion.div
            key={idx}
            initial={{ backgroundColor: "hsl(var(--muted))" }}
            animate={{ 
              scale: currentStep === idx ? 1.2 : 1,
              opacity: currentStep >= idx ? 1 : 0.3,
              backgroundColor: currentStep >= idx ? "hsl(var(--primary))" : "hsl(var(--muted))"
            }}
            className="h-2 w-2 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};
