import { Hono } from "hono";
import { extractionSystemPrompt } from "./utils/prompts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Define menu item types
interface MenuAddon {
  name: string;
  price: number | null;
}

interface MenuItem {
  name: string;
  description: string | null;
  price: number | null;
  addons: MenuAddon[];
  image?: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

interface ExtractedMenuData {
  categories: MenuCategory[];
  currency: string | null;
  rawText: string;
}

// Fallback parser to convert text response to structured JSON
function parseTextToMenuData(text: string): ExtractedMenuData {
  const categories: MenuCategory[] = [];
  let currentCategory: MenuCategory | null = null;
  const lines = text.split("\n");

  // Common category patterns
  const categoryPattern = /^\*{0,2}([A-Za-z &]+)\*{0,2}$/;
  // Item pattern: "* Item Name - $12.99" or "Item Name - $12.99"
  const itemPattern = /^[\*\-]?\s*([^-$]+?)\s*[-–]\s*\$?([\d.]+)/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for category header
    const categoryMatch = trimmedLine.match(categoryPattern);
    if (
      categoryMatch &&
      !trimmedLine.includes("$") &&
      !trimmedLine.includes("-")
    ) {
      if (currentCategory && currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }
      currentCategory = {
        category: categoryMatch[1].trim(),
        items: [],
      };
      continue;
    }

    // Check for menu item
    const itemMatch = trimmedLine.match(itemPattern);
    if (itemMatch && currentCategory) {
      const name = itemMatch[1]
        .trim()
        .replace(/^\*+|\*+$/g, "")
        .trim();
      const price = parseFloat(itemMatch[2]);
      if (name && !isNaN(price)) {
        currentCategory.items.push({
          name,
          description: null,
          price,
          addons: [],
        });
      }
    }
  }

  // Push the last category
  if (currentCategory && currentCategory.items.length > 0) {
    categories.push(currentCategory);
  }

  return {
    categories,
    currency: "USD",
    rawText: text,
  };
}

app.get("/api/health", (c) => c.json("Healthy 🔥"));

app.post("/api/extract-menu", async (c) => {
  try {
    // Use native Request formData() for better multipart handling in Workers
    const formData = await c.req.raw.formData();
    const image = formData.get("image") as File | null;
    const additionalText = formData.get("additionalText") as string | null;

    if (!image) {
      return c.json({ error: "Image file is required" }, 400);
    }

    // Convert image to base64 data URL for the vision model
    const imageBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);

    // Convert to base64 in chunks to avoid stack overflow
    let binaryString = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const base64Image = btoa(binaryString);

    const mimeType = image.type || "image/jpeg";
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    /**
     * Process with Llama 3.2 Vision Model
     * Extract categorized menu items with prices from the restaurant menu image
     */
    const userPrompt = additionalText
      ? `Extract the menu data from this image. Additional context: ${additionalText}`
      : "Extract all menu items, categories, prices, and any addons from this restaurant menu image.";

    const aiResponse = await c.env.AI.run(
      "@cf/meta/llama-3.2-11b-vision-instruct",
      {
        messages: [
          {
            role: "system",
            content: extractionSystemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      },
    );

    // Parse the AI response to extract JSON
    let extractedData: ExtractedMenuData;
    const responseText =
      typeof aiResponse === "string"
        ? aiResponse
        : (aiResponse as { response?: string }).response || "";

    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate the parsed data has the expected structure
        if (parsed.categories && Array.isArray(parsed.categories)) {
          extractedData = parsed;
          extractedData.rawText = responseText;
        } else {
          // JSON found but wrong structure, use fallback parser
          console.log("JSON structure invalid, using fallback parser");
          extractedData = parseTextToMenuData(responseText);
        }
      } else {
        // No JSON found, use fallback parser to extract from text
        console.log("No JSON found, using fallback parser");
        extractedData = parseTextToMenuData(responseText);
      }
    } catch (parseError) {
      console.error("Error parsing AI response, using fallback:", parseError);
      // Use fallback parser when JSON parsing fails
      extractedData = parseTextToMenuData(responseText);
    }

    return c.json(
      {
        success: true,
        data: extractedData,
        metadata: {
          fileName: image.name,
          fileSize: image.size,
          mimeType: mimeType,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Error processing menu extraction:", error);
    return c.json(
      { error: "Error occurred while processing menu extraction." },
      500,
    );
  }
});

// Image generation endpoint using Flux-1-schnell model
app.post("/api/generate-image", async (c) => {
  try {
    const body = await c.req.json();
    const { itemName, additionalPrompt } = body;

    if (!itemName) {
      return c.json({ error: "Item name is required" }, 400);
    }

    // Build the prompt for food image generation
    const basePrompt = `Professional food photography of "${itemName}", appetizing restaurant menu style, high quality, well-lit, on a clean plate, food styling, editorial quality`;
    const fullPrompt = additionalPrompt
      ? `${basePrompt}, ${additionalPrompt}`
      : basePrompt;

    // Generate image using Flux-1-schnell model
    const aiResponse = await c.env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      {
        prompt: fullPrompt,
        steps: 4,
      },
    );

    // The response contains the image as base64
    const imageBase64 = (aiResponse as { image?: string }).image;

    if (!imageBase64) {
      return c.json({ error: "Failed to generate image" }, 500);
    }

    return c.json(
      {
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
        prompt: fullPrompt,
      },
      200,
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return c.json({ error: "Error occurred while generating image." }, 500);
  }
});

export default app;
