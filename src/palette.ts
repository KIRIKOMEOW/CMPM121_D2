import type { PaletteRenderer, ToolDefinition } from "./types.ts";

function category(tool: ToolDefinition): string {
  if (tool.kind === "marker" || tool.kind === "eraser") return "Brushes";
  if (
    tool.kind === "sticker" && tool.category !== "emoji" &&
    !/\p{Extended_Pictographic}/u.test(tool.text)
  ) return "Text";
  return "Emoji & stamps";
}

export const renderToolPalette: PaletteRenderer = (
  container,
  tools,
  selectedToolId,
  onSelect,
) => {
  const active = document.activeElement;
  const focusedId =
    active instanceof HTMLButtonElement && container.contains(active)
      ? active.dataset.toolId
      : undefined;
  const buttons: HTMLButtonElement[] = [];
  const groups = ["Text", "Emoji & stamps", "Brushes"].map((name) => {
    const group = document.createElement("section");
    group.className = "palette-group";
    group.setAttribute("aria-label", name);
    const heading = document.createElement("h3");
    heading.textContent = name;
    const items = document.createElement("div");
    items.className = "palette-items";
    for (const tool of tools.filter((tool) => category(tool) === name)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-tool";
      button.dataset.toolId = tool.id;
      button.setAttribute("aria-label", tool.label);
      button.setAttribute("aria-pressed", String(tool.id === selectedToolId));
      const preview = document.createElement("span");
      preview.className = "tool-preview";
      preview.setAttribute("aria-hidden", "true");
      if (tool.kind === "marker") {
        const stroke = document.createElement("span");
        stroke.className = "marker-swatch";
        stroke.style.backgroundColor = tool.color;
        stroke.style.height = `${Math.min(tool.width, 16)}px`;
        preview.append(stroke);
        button.title = `${tool.label}: ${tool.width}px. Drag to draw.`;
      } else if (tool.kind === "eraser") {
        preview.textContent = "▱";
        button.title = `${tool.label}: ${tool.width}px. Drag to erase.`;
      } else if (tool.kind === "image") {
        const image = document.createElement("img");
        image.src = tool.image.src;
        image.alt = "";
        preview.append(image);
        button.title = `${tool.label}: click to stamp your PNG.`;
      } else {
        preview.textContent = category(tool) === "Text" ? "Aa" : tool.text;
        button.title =
          `${tool.label}: ${tool.text}, ${tool.size}px. Click to place.`;
      }
      const label = document.createElement("span");
      label.className = "tool-label";
      label.textContent = tool.label;
      button.append(preview, label);
      button.addEventListener("click", () => onSelect(tool.id));
      buttons.push(button);
      items.append(button);
    }
    if (!items.children.length) {
      const hint = document.createElement("p");
      hint.className = "palette-hint";
      hint.textContent = "Use Add text to make a text stamp.";
      items.append(hint);
    }
    group.append(heading, items);
    return group;
  });
  container.replaceChildren(...groups);
  if (focusedId) buttons.find((b) => b.dataset.toolId === focusedId)?.focus();
};
