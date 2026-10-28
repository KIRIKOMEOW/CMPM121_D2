import {
  attachCanvasInput,
  createCommandFactory,
  createToolRegistry,
  DOCUMENT_SETTINGS,
  EXPORT_SCALE,
  renderDocument,
} from "./core.ts";
import { PRESET_TOOLS } from "./presets.ts";
import type {
  DrawingCommand,
  InteractionState,
  PaletteRenderer,
  ToolDefinition,
} from "./types.ts";
import { renderToolPalette } from "./palette.ts";

export function mountSketchpad(
  app: HTMLElement,
  initialTools: readonly ToolDefinition[] = PRESET_TOOLS,
  drawPalette: PaletteRenderer = renderToolPalette,
): () => void {
  const tools = createToolRegistry(initialTools);
  const interaction: InteractionState = {
    selectedToolId: tools.getAll()[0]?.id ?? null,
    preview: null,
  };
  let committed: readonly DrawingCommand[] = [];

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
  let redrawButton: HTMLButtonElement | undefined;
  for (
    const label of ["Undo", "Redo", "Redraw", "Create Tool", "Export PNG"]
  ) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = label !== "Redraw";
    if (label === "Redraw") redrawButton = button;
    controls.append(button);
  }

  const canvas = document.createElement("canvas");
  canvas.width = DOCUMENT_SETTINGS.width;
  canvas.height = DOCUMENT_SETTINGS.height;
  canvas.setAttribute("aria-label", "Postcard canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not available.");

  const dimensions = document.createElement("p");
  dimensions.textContent = `Canvas: ${canvas.width} × ${canvas.height}. ` +
    `PNG export: ${canvas.width * EXPORT_SCALE} × ${
      canvas.height * EXPORT_SCALE
    }.`;
  drawingArea.append(controls, canvas, dimensions);
  layout.append(sidebar, drawingArea);
  app.replaceChildren(heading, note, layout);

  function redraw(): void {
    renderDocument(
      context!,
      { ...DOCUMENT_SETTINGS, commands: committed },
      interaction.preview,
    );
  }

  const input = attachCanvasInput({
    canvas,
    documentSize: DOCUMENT_SETTINGS,
    commands: createCommandFactory(),
    getSelectedTool: () =>
      interaction.selectedToolId
        ? tools.getById(interaction.selectedToolId)
        : undefined,
    onPreviewChange(preview) {
      interaction.preview = preview;
      redraw();
    },
    onCommit(command) {
      committed = Object.freeze([...committed, command]);
      redraw();
    },
  });

  function refreshPalette(): void {
    drawPalette(
      palette,
      tools.getAll(),
      interaction.selectedToolId,
      (toolId) => {
        if (!tools.getById(toolId)) return;
        input.cancelGesture();
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

  redrawButton!.addEventListener("click", redraw);
  refreshPalette();
  redraw();

  return () => {
    input.dispose();
    redrawButton!.removeEventListener("click", redraw);
    app.replaceChildren();
  };
}

const app = document.querySelector<HTMLElement>("#app");
if (app) mountSketchpad(app);
