import {
  attachCanvasInput,
  createCommandFactory,
  createHistoryStore,
  createToolRegistry,
  DOCUMENT_SETTINGS,
  EXPORT_SCALE,
  renderDocument,
} from "./core.ts";
import { PRESET_TOOLS } from "./presets.ts";
import type {
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
  const history = createHistoryStore();

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
  function addButton(label: string, disabled = false): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    controls.append(button);
    return button;
  }
  const undoButton = addButton("Undo", true);
  const redoButton = addButton("Redo", true);
  const redrawButton = addButton("Redraw");
  addButton("Create Tool", true);
  addButton("Export PNG", true);

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
    const state = history.getState();
    renderDocument(
      context!,
      { ...DOCUMENT_SETTINGS, commands: state.commands },
      interaction.preview,
    );
    undoButton.disabled = !state.canUndo;
    redoButton.disabled = !state.canRedo;
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
      history.commit(command);
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

  function undo(): void {
    input.cancelGesture();
    history.undo();
    redraw();
  }

  function redo(): void {
    input.cancelGesture();
    history.redo();
    redraw();
  }

  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);
  redrawButton.addEventListener("click", redraw);
  refreshPalette();
  redraw();

  return () => {
    input.dispose();
    undoButton.removeEventListener("click", undo);
    redoButton.removeEventListener("click", redo);
    redrawButton.removeEventListener("click", redraw);
    app.replaceChildren();
  };
}

const app = document.querySelector<HTMLElement>("#app");
if (app) mountSketchpad(app);
