import {
  extractedData as $extractedData,
  setExtractedData,
} from "@client/lib/stores/toolStore";
import type {
  MenuCategory,
  MenuItem,
  ExtractedMenuData,
} from "@client/lib/types";
import { useStore } from "@nanostores/react";
import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  CheckIcon,
  XIcon,
  ImageIcon,
} from "lucide-react";
import { ImageGeneratorDialog } from "./image-generator";

// Sortable Menu Item Component
interface SortableMenuItemProps {
  item: MenuItem;
  itemId: string;
  categoryIndex: number;
  itemIndex: number;
  onUpdateItem: (
    categoryIndex: number,
    itemIndex: number,
    field: keyof MenuItem,
    value: string | number | null,
  ) => void;
  onDeleteItem: (categoryIndex: number, itemIndex: number) => void;
  onOpenImageDialog: (categoryIndex: number, itemIndex: number) => void;
}

function SortableMenuItem({
  item,
  itemId,
  categoryIndex,
  itemIndex,
  onUpdateItem,
  onDeleteItem,
  onOpenImageDialog,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-white p-2 dark:bg-zinc-950"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => onOpenImageDialog(categoryIndex, itemIndex)}
        className="shrink-0"
      >
        <Avatar className="hover:ring-primary size-8 cursor-pointer hover:ring-2 hover:ring-offset-2">
          <AvatarImage src={item.image} />
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
            <ImageIcon className="text-muted-foreground size-4" />
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="flex flex-1 items-center gap-2">
        <Input
          value={item.name}
          onChange={(e) =>
            onUpdateItem(categoryIndex, itemIndex, "name", e.target.value)
          }
          placeholder="Item name"
          className="h-8 flex-1"
        />
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            value={item.price ?? ""}
            onChange={(e) =>
              onUpdateItem(
                categoryIndex,
                itemIndex,
                "price",
                e.target.value ? parseFloat(e.target.value) : null,
              )
            }
            placeholder="0.00"
            className="h-8 w-20"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive size-8"
        onClick={() => onDeleteItem(categoryIndex, itemIndex)}
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}

// Dragging overlay item preview
function MenuItemOverlay({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-white p-2 shadow-lg dark:bg-zinc-950">
      <GripVerticalIcon className="text-muted-foreground size-4" />
      <div className="flex flex-1 items-center gap-2">
        <span className="flex-1 text-sm">{item.name}</span>
        <span className="text-muted-foreground text-sm">
          ${item.price?.toFixed(2) ?? "N/A"}
        </span>
      </div>
    </div>
  );
}

// Category Header Component with Edit functionality
interface CategoryHeaderProps {
  category: MenuCategory;
  categoryIndex: number;
  onUpdateCategoryName: (index: number, name: string) => void;
  onDeleteCategory: (index: number) => void;
  onAddItem: (categoryIndex: number) => void;
  itemCount: number;
}

function CategoryHeader({
  category,
  categoryIndex,
  onUpdateCategoryName,
  onDeleteCategory,
  onAddItem,
  itemCount,
}: CategoryHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.category);

  const handleSave = () => {
    onUpdateCategoryName(categoryIndex, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(category.category);
    setIsEditing(false);
  };

  return (
    <div className="flex w-full items-center gap-2">
      {isEditing ? (
        <>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 flex-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          >
            <CheckIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
          >
            <XIcon className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-left font-medium">
            {category.category}
          </span>
          <span className="text-muted-foreground text-xs">
            {itemCount} items
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <PencilIcon className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onAddItem(categoryIndex);
            }}
          >
            <PlusIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive size-8"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategory(categoryIndex);
            }}
          >
            <Trash2Icon className="size-3" />
          </Button>
        </>
      )}
    </div>
  );
}

export function RefineStep() {
  const extractedData = useStore($extractedData);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedItemForImage, setSelectedItemForImage] = useState<{
    categoryIndex: number;
    itemIndex: number;
  } | null>(null);

  // Track original position when drag starts
  const [dragStartPosition, setDragStartPosition] = useState<{
    catIndex: number;
    itemIndex: number;
    item: MenuItem;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Create unique IDs for items using a stable identifier
  const getItemId = (catIndex: number, itemIndex: number) =>
    `item-${catIndex}-${itemIndex}`;

  // Parse item ID back to indices
  const parseItemId = (id: string) => {
    const parts = id.replace("item-", "").split("-");
    return { catIndex: parseInt(parts[0]), itemIndex: parseInt(parts[1]) };
  };

  // Find active item for overlay - use dragStartPosition for stability
  const activeItem = useMemo(() => {
    return dragStartPosition?.item ?? null;
  }, [dragStartPosition]);

  const updateData = (newCategories: MenuCategory[]) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      data: {
        ...extractedData.data,
        categories: newCategories,
      },
    });
  };

  const handleOpenImageDialog = (categoryIndex: number, itemIndex: number) => {
    setSelectedItemForImage({ categoryIndex, itemIndex });
    setImageDialogOpen(true);
  };

  const handleUpdateItem = (
    categoryIndex: number,
    itemIndex: number,
    field: keyof MenuItem,
    value: string | number | null,
  ) => {
    if (!extractedData?.data?.categories) return;
    const newCategories = [...extractedData.data.categories];
    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      items: newCategories[categoryIndex].items.map((item, idx) =>
        idx === itemIndex ? { ...item, [field]: value } : item,
      ),
    };
    updateData(newCategories);
  };

  const handleDeleteItem = (categoryIndex: number, itemIndex: number) => {
    if (!extractedData?.data?.categories) return;
    const newCategories = [...extractedData.data.categories];
    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      items: newCategories[categoryIndex].items.filter(
        (_, idx) => idx !== itemIndex,
      ),
    };
    updateData(newCategories);
  };

  const handleAddItem = (categoryIndex: number) => {
    if (!extractedData?.data?.categories) return;
    const newCategories = [...extractedData.data.categories];
    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      items: [
        ...newCategories[categoryIndex].items,
        { name: "New Item", description: null, price: 0, addons: [] },
      ],
    };
    updateData(newCategories);

    // Open the category if not already open
    const categoryId = `category-${categoryIndex}`;
    if (!openCategories.includes(categoryId)) {
      setOpenCategories([...openCategories, categoryId]);
    }
  };

  const handleUpdateCategoryName = (index: number, name: string) => {
    if (!extractedData?.data?.categories) return;
    const newCategories = [...extractedData.data.categories];
    newCategories[index] = { ...newCategories[index], category: name };
    updateData(newCategories);
  };

  const handleDeleteCategory = (index: number) => {
    if (!extractedData?.data?.categories) return;
    const newCategories = extractedData.data.categories.filter(
      (_, idx) => idx !== index,
    );
    updateData(newCategories);
  };

  const handleAddCategory = () => {
    if (!extractedData?.data?.categories) return;
    const newCategories = [
      ...extractedData.data.categories,
      { category: "New Category", items: [] },
    ];
    updateData(newCategories);

    // Open the new category
    const newCategoryId = `category-${newCategories.length - 1}`;
    setOpenCategories([...openCategories, newCategoryId]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { catIndex, itemIndex } = parseItemId(String(event.active.id));
    if (extractedData?.data?.categories?.[catIndex]?.items?.[itemIndex]) {
      setDragStartPosition({
        catIndex,
        itemIndex,
        item: extractedData.data.categories[catIndex].items[itemIndex],
      });
    }
    setActiveId(event.active.id);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Don't update data during drag - wait for dragEnd
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset drag state
    setActiveId(null);
    setDragStartPosition(null);

    if (!over || !extractedData?.data?.categories || !dragStartPosition) return;

    const overIdStr = String(over.id);
    const { catIndex: overCatIndex, itemIndex: overItemIndex } =
      parseItemId(overIdStr);

    const { catIndex: activeCatIndex, itemIndex: activeItemIndex } =
      dragStartPosition;

    // No change if dropped in same position
    if (activeCatIndex === overCatIndex && activeItemIndex === overItemIndex)
      return;

    const newCategories = JSON.parse(
      JSON.stringify(extractedData.data.categories),
    );

    // Remove from original position
    const [movedItem] = newCategories[activeCatIndex].items.splice(
      activeItemIndex,
      1,
    );

    // Calculate insert index - if same category and moving down, adjust for removal
    let insertIndex = overItemIndex;
    if (activeCatIndex === overCatIndex && activeItemIndex < overItemIndex) {
      insertIndex = overItemIndex; // Already adjusted by splice
    }

    // Insert at new position
    newCategories[overCatIndex].items.splice(insertIndex, 0, movedItem);

    updateData(newCategories);
  };

  if (!extractedData?.data?.categories) {
    return (
      <Card className="shadow-none">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No menu data to refine. Please extract data from a menu image first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Refine Menu Data</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddCategory}>
            <PlusIcon className="mr-1 size-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {/* <ScrollArea className="h-[500px] pr-4"> */}
          <div className="">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <Accordion
                type="multiple"
                value={openCategories}
                onValueChange={setOpenCategories}
                className="space-y-2"
              >
                {extractedData.data.categories.map((category, catIndex) => {
                  const categoryItemIds = category.items.map((_, itemIndex) =>
                    getItemId(catIndex, itemIndex),
                  );

                  return (
                    <AccordionItem
                      key={`category-${catIndex}`}
                      value={`category-${catIndex}`}
                      className="rounded-md border px-3"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <CategoryHeader
                          category={category}
                          categoryIndex={catIndex}
                          onUpdateCategoryName={handleUpdateCategoryName}
                          onDeleteCategory={handleDeleteCategory}
                          onAddItem={handleAddItem}
                          itemCount={category.items.length}
                        />
                      </AccordionTrigger>
                      <AccordionContent>
                        <SortableContext
                          items={categoryItemIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {category.items.map((item, itemIndex) => (
                              <SortableMenuItem
                                key={getItemId(catIndex, itemIndex)}
                                item={item}
                                itemId={getItemId(catIndex, itemIndex)}
                                categoryIndex={catIndex}
                                itemIndex={itemIndex}
                                onUpdateItem={handleUpdateItem}
                                onDeleteItem={handleDeleteItem}
                                onOpenImageDialog={handleOpenImageDialog}
                              />
                            ))}
                            {category.items.length === 0 && (
                              <p className="text-muted-foreground py-4 text-center text-sm">
                                No items in this category. Click + to add items.
                              </p>
                            )}
                          </div>
                        </SortableContext>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              <DragOverlay>
                {activeItem ? <MenuItemOverlay item={activeItem} /> : null}
              </DragOverlay>
            </DndContext>

            {extractedData.data.categories.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No categories yet. Click "Add Category" to get started.
                </p>
              </div>
            )}
          </div>
          {/* </ScrollArea> */}

          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <Button variant="outline">Reset Changes</Button>
            <Button>Save & Export</Button>
          </div>
        </CardContent>
      </Card>

      <ImageGeneratorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        selectedItem={selectedItemForImage}
        onSubmit={(imageUrl) => {
          // Update the extracted data store with the generated image
          if (selectedItemForImage) {
            const { categoryIndex, itemIndex } = selectedItemForImage;
            const currentData = $extractedData.get();
            if (
              currentData?.data?.categories?.[categoryIndex]?.items?.[itemIndex]
            ) {
              const updatedData = {
                ...currentData,
                data: {
                  ...currentData.data,
                  categories: currentData.data.categories.map((cat, catIdx) =>
                    catIdx === categoryIndex
                      ? {
                          ...cat,
                          items: cat.items.map((item, idx) =>
                            idx === itemIndex
                              ? { ...item, image: imageUrl }
                              : item,
                          ),
                        }
                      : cat,
                  ),
                },
              };
              $extractedData.set(updatedData);
            }
          }
          setImageDialogOpen(false);
        }}
      />
    </>
  );
}
