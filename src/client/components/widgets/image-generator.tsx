import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { extractedData as $extractedData } from "@client/lib/stores/toolStore";
import { useStore } from "@nanostores/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  SparklesIcon,
  Loader2Icon,
  RefreshCwIcon,
  CheckIcon,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: {
    categoryIndex: number;
    itemIndex: number;
  } | null;
  onSubmit?: (imageUrl: string) => void;
};

export function ImageGeneratorDialog({
  open,
  onOpenChange,
  selectedItem,
  onSubmit,
}: Props) {
  const extractedData = useStore($extractedData);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemName = selectedItem
    ? extractedData?.data?.categories?.[selectedItem.categoryIndex]?.items?.[
        selectedItem.itemIndex
      ]?.name
    : null;

  const existingImage = selectedItem
    ? extractedData?.data?.categories?.[selectedItem.categoryIndex]?.items?.[
        selectedItem.itemIndex
      ]?.image
    : null;

  const handleGenerate = async () => {
    if (!itemName) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName,
          additionalPrompt: additionalPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || "Failed to generate image");
      }

      setGeneratedImage((data as any).image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (generatedImage && onSubmit) {
      onSubmit(generatedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    setGeneratedImage(null);
    setAdditionalPrompt("");
    setError(null);
    onOpenChange(false);
  };

  const displayImage = generatedImage || existingImage;
  const hasGeneratedNew = generatedImage !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Menu Item Image</DialogTitle>
          <DialogDescription>
            {itemName
              ? `Create an AI-generated image for "${itemName}"`
              : "Generate an image for this menu item"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Preview Area */}
          <div className="relative">
            <div className="bg-secondary/40 border-secondary flex h-52 w-full items-center justify-center overflow-hidden rounded-lg border">
              {isLoading ? (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2Icon className="size-10 animate-spin text-cyan-500" />
                  <p className="text-sm">Generating image...</p>
                </div>
              ) : displayImage ? (
                <img
                  src={displayImage}
                  alt={itemName || "Generated image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <SparklesIcon className="size-10 text-cyan-500/50" />
                  <p className="text-sm">Click generate to create an image</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          {/* Additional Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="additionalPrompt">
              Additional styling (optional)
            </Label>
            <Input
              id="additionalPrompt"
              placeholder="e.g., rustic plating, dark background, garnished with herbs..."
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {/* Generate / Regenerate Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={isLoading || !itemName}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : hasGeneratedNew || existingImage ? (
              <>
                <RefreshCwIcon className="mr-2 size-4" />
                Regenerate
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 size-4" />
                Generate
              </>
            )}
          </Button>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!generatedImage || isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 sm:w-auto"
          >
            <CheckIcon className="mr-2 size-4" />
            Use This Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
