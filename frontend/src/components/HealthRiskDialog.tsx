import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";

interface HealthRiskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  healthRisk?: 'Safe' | 'Moderate' | 'Harmful';
  productName?: string;
}

export function HealthRiskDialog({ isOpen, onClose, healthRisk, productName }: HealthRiskDialogProps) {
  if (!healthRisk) return null;

  const getRiskContent = () => {
    switch (healthRisk) {
      case 'Safe':
        return {
          icon: <ShieldCheck className="h-12 w-12 text-green-500" />,
          title: 'SAFE FOR CONSUMPTION',
          description: `${productName || 'This product'} appears to be safe for consumption based on our analysis.`,
          buttonClass: 'bg-green-500 hover:bg-green-600',
          color: 'text-green-500'
        };
      case 'Moderate':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          title: 'MODERATELY HARMFUL',
          description: `${productName || 'This product'} contains some ingredients that may be concerning. Please review the detailed analysis below.`,
          buttonClass: 'bg-yellow-500 hover:bg-yellow-600',
          color: 'text-yellow-500'
        };
      case 'Harmful':
        return {
          icon: <ShieldX className="h-12 w-12 text-red-500" />,
          title: 'HARMFUL',
          description: `${productName || 'This product'} contains potentially harmful ingredients. We recommend reviewing the detailed analysis carefully.`,
          buttonClass: 'bg-red-500 hover:bg-red-600',
          color: 'text-red-500'
        };
    }
  };

  const content = getRiskContent();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4">
            {content?.icon}
          </div>
          <AlertDialogTitle className={`text-center text-xl font-bold ${content?.color}`}>
            {content?.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base mt-2">
            {content?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <Button
            className={`w-full ${content?.buttonClass} text-white`}
            onClick={onClose}
          >
            View Details
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}