import { createToolRegistry, DOCUMENT_SETTINGS, EXPORT_SCALE } from "./core.ts";
import { PRESET_TOOLS } from "./presets.ts";
import type { InteractionState } from "./types.ts";
import { renderToolPalette } from "./palette.ts";

const app = document.querySelector<HTMLElement>("#app")!;
const tools = createToolRegistry(PRESET_TOOLS);
const interaction: InteractionState = {
  selectedToolId: tools.getAll()[0]?.id ?? null,
  preview: null,
};

const heading = document.createElement("h1");
heading.textContent = "Garden Postcard Sketchpad";

const note = document.createElement("p");
note.textContent = "Create a garden postcard with markers and stickers.";

const layout = document.createElement("div");
layout.className = "workspace";

const sidebar = document.createElement("aside");
const toolsHeading = document.createElement("h2");
toolsHeading.textContent = "Tools";
const palette = document.createElement("div");
palette.className = "tool-palette";
const selection = document.createElement("p");
selection.setAttribute("aria-live", "polite");
sidebar.append(toolsHeading, palette, selection);

const drawingArea = document.createElement("section");
const controls = document.createElement("div");
controls.className = "controls";
for (
  const label of ["Undo", "Redo", "Redraw", "Create Tool", "Export PNG"]
) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.disabled = true;
  controls.append(button);
}

const canvas = document.createElement("canvas");
canvas.width = DOCUMENT_SETTINGS.width;
canvas.height = DOCUMENT_SETTINGS.height;
canvas.setAttribute("aria-label", "Postcard canvas");

const dimensions = document.createElement("p");
dimensions.textContent = `Canvas: ${canvas.width} × ${canvas.height}. ` +
  `PNG export: ${canvas.width * EXPORT_SCALE} × ${
    canvas.height * EXPORT_SCALE
  }.`;
drawingArea.append(controls, canvas, dimensions);
layout.append(sidebar, drawingArea);
app.append(heading, note, layout);

function refreshPalette(): void {
  renderToolPalette(
    palette,
    tools.getAll(),
    interaction.selectedToolId,
    (toolId) => {
      if (!tools.getById(toolId)) return;
      interaction.selectedToolId = toolId;
      refreshPalette();
    },
  );
  const selected = interaction.selectedToolId
    ? tools.getById(interaction.selectedToolId)
    : undefined;
  selection.textContent = selected
    ? `Selected tool: ${selected.label}`
    : "No tool selected.";
}

refreshPalette();
