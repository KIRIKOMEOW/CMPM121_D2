import type { ToolDefinition } from "./types.ts";

// Presets use the same definitions and command pipeline as user-created tools.
export const PRESET_TOOLS: readonly ToolDefinition[] = [
  {
    id: "fine-marker",
    label: "Fine pen",
    kind: "marker",
    color: "#356b3f",
    width: 3,
  },
  {
    id: "broad-marker",
    label: "Broad pen",
    kind: "marker",
    color: "#d4436a",
    width: 12,
  },
  { id: "flower", label: "Flower", kind: "sticker", text: "🌸", size: 48 },
  { id: "tree", label: "Tree", kind: "sticker", text: "🌳", size: 64 },
  {
    id: "butterfly",
    label: "Butterfly",
    kind: "sticker",
    text: "🦋",
    size: 48,
  },
  { id: "sun", label: "Sun", kind: "sticker", text: "☀️", size: 64 },
  { id: "hello", label: "Hello", kind: "sticker", text: "Hello", size: 40 },
];
