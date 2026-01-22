export type ToolSteps = "upload" | "process" | "refine";

// Step mapper
export const toolStepNameMapper: Record<ToolSteps, string> = {
  upload: "Upload",
  process: "Process",
  refine: "Refine",
};

// Menu extraction types
export interface MenuAddon {
  name: string;
  price: number | null;
}

export interface MenuItem {
  name: string;
  description: string | null;
  price: number | null;
  addons: MenuAddon[];
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface ExtractedMenuData {
  categories: MenuCategory[];
  currency: string | null;
  rawText: string;
}

export interface MenuExtractionResponse {
  success: boolean;
  data: ExtractedMenuData;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}
