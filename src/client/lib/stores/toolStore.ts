import { atom } from "nanostores";
import type { MenuExtractionResponse, ToolSteps } from "../types";

// Tool Step State Store
export const step = atom<ToolSteps>("upload");

export function setStep(newStep: ToolSteps) {
  step.set(newStep);
}

// Menu image store
export const menuImage = atom<File | null>(null);

export function setMenuImage(file: File | null) {
  menuImage.set(file);
}

// Menu Response store
export const extractedData = atom<MenuExtractionResponse | null>(null);

export function setExtractedData(data: MenuExtractionResponse | null) {
  extractedData.set(data);
}
