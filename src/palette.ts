import type { PaletteRenderer } from "./types.ts";

export const renderToolPalette: PaletteRenderer = (
  container,
  tools,
  selectedToolId,
  onSelect,
) => {
  // Rendering replaces the buttons, so preserve keyboard focus across selection.
  const active = document.activeElement;
  const focusedId =
    active instanceof HTMLButtonElement && container.contains(active)
      ? active.dataset.toolId
      : undefined;
  const buttons = tools.map((tool) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-tool";
    button.dataset.toolId = tool.id;
    button.setAttribute("aria-pressed", String(tool.id === selectedToolId));
    const preview = document.createElement("span");
    preview.className = "tool-preview";
    preview.setAttribute("aria-hidden", "true");
    if (tool.kind === "marker") {
      const stroke = document.createElement("span");
      stroke.className = "marker-swatch";
      stroke.style.backgroundColor = tool.color;
      stroke.style.height = `${Math.min(tool.width, 20)}px`;
      preview.append(stroke);
      button.title =
        `${tool.label}: ${tool.width}px marker, ${tool.color}. Drag to draw.`;
    } else {
      preview.textContent = tool.text;
      button.title =
        `${tool.label}: ${tool.size}px sticker. Click the canvas to place.`;
    }
    const label = document.createElement("span");
    label.className = "tool-label";
    label.textContent = tool.label;
    button.append(preview, label);
    button.addEventListener("click", () => onSelect(tool.id));
    return button;
  });
  container.replaceChildren(...buttons);
  if (focusedId) {
    buttons.find((button) => button.dataset.toolId === focusedId)?.focus();
  }
};
