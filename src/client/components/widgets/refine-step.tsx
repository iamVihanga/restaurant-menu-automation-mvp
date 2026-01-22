import { extractedData as $extractedData } from "@client/lib/stores/toolStore";
import { useStore } from "@nanostores/react";
import React from "react";

export function RefineStep() {
  const extractedData = useStore($extractedData);

  return <div></div>;
}
