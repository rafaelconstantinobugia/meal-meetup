import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Heart, Users, MessageCircle } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Descobre Pratos",
      description: "Faz swipe nos pratos que te interessam. Simples e visual!",
      icon: <Heart className="h-16 w-16 text-primary mb-4" />,
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"
    },
    {
      title: "Encontra o Teu Match",
      description: "Quando duas pessoas escolhem o mesmo prato, é match!",
      icon: <Users className="h-16 w-16 text-primary mb-4" />,
      image: "https://images.unsplash.com/photo-1559847844-d96692b91ad8?w=600&h=400&fit=crop"
    },
    {
      title: "Combina e Come",
      description: "Conversem, escolham um restaurante e desfrutem da refeição juntos!",
      icon: <MessageCircle className="h-16 w-16 text-primary mb-4" />,
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <Card className="w-full max-w-sm glass-card animate-fade-in-up">
        <CardContent className="p-6 text-center">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
              <img
                src={currentStepData.image}
                alt={currentStepData.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex justify-center mb-4">
              {currentStepData.icon}
            </div>
            
            <h2 className="text-2xl font-bold mb-3 appetite-text">
              {currentStepData.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`${currentStep === 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} de {steps.length}
            </span>

            <Button
              size="icon"
              onClick={nextStep}
              className="food-button-primary"
            >
              {currentStep === steps.length - 1 ? (
                "✓"
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Skip option */}
          {currentStep < steps.length - 1 && (
            <Button
              variant="ghost"
              onClick={onComplete}
              className="w-full mt-4 text-muted-foreground"
            >
              Saltar introdução
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};