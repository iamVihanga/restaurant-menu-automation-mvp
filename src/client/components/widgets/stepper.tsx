import { toolStepNameMapper, type ToolSteps } from "@client/lib/types";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "@client/lib/utils";
import { useStore } from "@nanostores/react";
import {
  step,
  setStep,
  menuImage,
  extractedData,
} from "@client/lib/stores/toolStore";

export function Stepper() {
  const currentStep = useStore(step);
  const uploadedMenuImage = useStore(menuImage);
  const extractedMenuData = useStore(extractedData);

  const handleSetStep = (newStep: ToolSteps) => {
    setStep(newStep);
  };

  return (
    <div className="flex h-12 items-center gap-0">
      {Object.keys(toolStepNameMapper).map((key, index) => (
        <Button
          className={cn("h-12 rounded-none", {
            "border-primary border-b font-semibold": currentStep === key,
          })}
          variant={"ghost"}
          key={index}
          onClick={() => handleSetStep(key as ToolSteps)}
          disabled={
            (key !== "upload" && !uploadedMenuImage) ||
            (key === "refine" && !extractedMenuData)
          }
        >
          {toolStepNameMapper[key as ToolSteps]}
        </Button>
      ))}
    </div>
  );
}
