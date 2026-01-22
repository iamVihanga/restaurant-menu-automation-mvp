import {
  menuImage,
  extractedData as $extractedData,
  setExtractedData,
} from "@client/lib/stores/toolStore";
import type { MenuExtractionResponse, MenuCategory } from "@client/lib/types";
import { useStore } from "@nanostores/react";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { ArrowRightIcon, LoaderPinwheelIcon, SparkleIcon } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

type Props = {};

export function ProcessStep({}: Props) {
  const uploadedImage = useStore(menuImage);
  const extractedData = useStore($extractedData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractText = async () => {
    if (!uploadedImage) {
      setError("No image uploaded");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedImage);
      formData.append(
        "additionalText",
        "Extract all food items with prices, descriptions, and any available addons or extras",
      );

      const response = await fetch("/api/extract-menu", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract menu data");
      }

      const result: MenuExtractionResponse = await response.json();
      setExtractedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error extracting text:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return "Price N/A";
    const currencySymbol = currency === "USD" ? "$" : currency || "$";
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  const renderMenuPreview = (
    categories: MenuCategory[],
    currency: string | null,
  ) => {
    if (!categories || categories.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No menu categories extracted. The AI might have returned raw text
          instead.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {categories.map((category, catIndex) => (
          <div key={catIndex} className="space-y-2">
            <h3 className="border-b pb-1 text-base font-semibold">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-start justify-between rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.addons && item.addons.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.addons.length} addons
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {item.description}
                      </p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.addons.map((addon, addonIndex) => (
                          <span
                            key={addonIndex}
                            className="text-muted-foreground rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800"
                          >
                            {addon.name}
                            {addon.price !== null &&
                              ` (+${formatPrice(addon.price, currency)})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatPrice(item.price, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="">
        {uploadedImage && (
          <img
            src={URL.createObjectURL(uploadedImage)}
            alt="Uploaded Menu"
            className="h-72 w-full rounded-md border object-cover"
          />
        )}
      </div>
      <Card className="col-span-2 rounded-md shadow-none">
        <CardHeader>
          <CardTitle>Extract Text from the Menu Image</CardTitle>
          <CardDescription>
            {`Using OCR (Optical Character Recognition) with AI helps to
            accurately extract food items from menu`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            size="lg"
            className="mb-4 w-full cursor-pointer rounded-sm bg-linear-to-t from-zinc-950 to-zinc-900 text-zinc-50 hover:from-zinc-950 hover:to-zinc-800"
            onClick={handleExtractText}
            disabled={loading || !uploadedImage}
          >
            {loading ? (
              <LoaderPinwheelIcon className="animate-spin" />
            ) : (
              <SparkleIcon />
            )}
            {loading ? "Extracting..." : "Extract Data"}
          </Button>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Tabs defaultValue="preview" className="w-full">
            <TabsList
              className="h-9 w-full rounded-sm"
              defaultValue={"preview"}
            >
              <TabsTrigger className="rounded-sm" value="preview">
                Preview
              </TabsTrigger>
              <TabsTrigger className="rounded-sm" value="json">
                JSON
              </TabsTrigger>
              <TabsTrigger className="rounded-sm" value="raw">
                Raw Text
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <ScrollArea className="h-64 rounded-md border p-4">
                {extractedData?.data?.categories ? (
                  renderMenuPreview(
                    extractedData.data.categories,
                    extractedData.data.currency,
                  )
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Preview content will appear here after extraction.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="json">
              <ScrollArea className="h-64 rounded-md border p-4">
                {extractedData ? (
                  <pre className="overflow-x-auto text-xs">
                    {JSON.stringify(extractedData.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    JSON data will appear here after extraction.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="raw">
              <ScrollArea className="h-64 rounded-md border p-4">
                {extractedData?.data?.rawText ? (
                  <pre className="text-xs whitespace-pre-wrap">
                    {extractedData.data.rawText}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Raw AI response will appear here after extraction.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {extractedData && (
            <div className="mt-4">
              <Button
                variant={"destructive"}
                size="lg"
                className="h-10 w-full rounded-md bg-linear-to-t from-amber-700 to-amber-700/90"
              >
                Review & Edit Menu
                <ArrowRightIcon />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
