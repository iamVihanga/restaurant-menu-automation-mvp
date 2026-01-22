import { useStore } from "@nanostores/react";

import { Stepper } from "./stepper";
import { Separator } from "../ui/separator";
import { UploadStep } from "./upload-step";
import { step } from "@client/lib/stores/toolStore";
import { ProcessStep } from "./process-step";
import { RefineStep } from "./refine-step";

type Props = {};

export function ToolWidget({}: Props) {
  const currentStep = useStore(step);

  return (
    <div>
      <Stepper />

      <Separator />

      <div className="my-6">
        {currentStep === "upload" && <UploadStep />}
        {currentStep === "process" && <ProcessStep />}
        {currentStep === "refine" && <RefineStep />}
      </div>
    </div>
  );
}
