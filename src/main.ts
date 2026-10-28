import {
  attachCanvasInput,
  createCommandFactory,
  createHistoryStore,
  createToolRegistry,
  DOCUMENT_SETTINGS,
  EXPORT_SCALE,
  exportPng,
  renderDocument,
} from "./core.ts";
import { PRESET_TOOLS } from "./presets.ts";
import type {
  InteractionState,
  MountCustomToolForm,
  PaletteRenderer,
  ToolDefinition,
} from "./types.ts";
import { renderToolPalette } from "./palette.ts";

export const mountCustomToolForm: MountCustomToolForm = (options) => {
  const form = document.createElement("form");
  form.className = "tool-form";
  form.noValidate = true;
  const heading = document.createElement("h3");
  heading.textContent = "New Tool";

  function field(label: string, control: HTMLElement): HTMLLabelElement {
    const element = document.createElement("label");
    element.append(document.createTextNode(label), control);
    return element;
  }

  const name = document.createElement("input");
  name.type = "text";
  name.maxLength = 40;
  const kind = document.createElement("select");
  for (const [value, label] of [["marker", "Marker"], ["sticker", "Sticker"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    kind.append(option);
  }

  const color = document.createElement("input");
  color.type = "color";
  color.defaultValue = "#356b3f";
  const width = document.createElement("input");
  width.type = "number";
  width.min = "1";
  width.max = "40";
  width.step = "1";
  width.defaultValue = "4";
  const markerFields = document.createElement("div");
  markerFields.className = "tool-fields";
  markerFields.append(field("Color", color), field("Width", width));

  const text = document.createElement("input");
  text.type = "text";
  text.maxLength = 40;
  const size = document.createElement("input");
  size.type = "number";
  size.min = "8";
  size.max = "128";
  size.step = "1";
  size.defaultValue = "40";
  const stickerFields = document.createElement("div");
  stickerFields.className = "tool-fields";
  stickerFields.append(field("Text or Emoji", text), field("Size", size));

  const error = document.createElement("p");
  error.className = "form-error";
  error.setAttribute("role", "alert");
  const actions = document.createElement("div");
  actions.className = "controls";
  const add = document.createElement("button");
  add.type = "submit";
  add.textContent = "Add Tool";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  actions.append(add, cancel);
  form.append(
    heading,
    field("Name", name),
    field("Tool Type", kind),
    markerFields,
    stickerFields,
    error,
    actions,
  );
  options.container.replaceChildren(form);

  function updateFields(): void {
    markerFields.hidden = kind.value !== "marker";
    stickerFields.hidden = kind.value !== "sticker";
    error.textContent = "";
  }

  function reset(): void {
    form.reset();
    updateFields();
  }

  function submit(event: SubmitEvent): void {
    event.preventDefault();
    const label = name.value.trim();
    if (!label) {
      error.textContent = "Enter a tool name.";
      name.focus();
      return;
    }
    const id = `custom-${crypto.randomUUID()}`;
    if (kind.value === "marker") {
      const brushWidth = Number(width.value);
      if (!Number.isInteger(brushWidth) || brushWidth < 1 || brushWidth > 40) {
        error.textContent = "Choose a width from 1 to 40.";
        width.focus();
        return;
      }
      options.onCreate({
        id,
        label,
        kind: "marker",
        color: color.value,
        width: brushWidth,
      });
    } else {
      const content = text.value.trim();
      const fontSize = Number(size.value);
      if (!content) {
        error.textContent = "Enter sticker text or an emoji.";
        text.focus();
        return;
      }
      if (!Number.isInteger(fontSize) || fontSize < 8 || fontSize > 128) {
        error.textContent = "Choose a size from 8 to 128.";
        size.focus();
        return;
      }
      options.onCreate({
        id,
        label,
        kind: "sticker",
        text: content,
        size: fontSize,
      });
    }
    reset();
  }

  function cancelCreation(): void {
    reset();
    options.onCancel?.();
  }

  kind.addEventListener("change", updateFields);
  form.addEventListener("submit", submit);
  cancel.addEventListener("click", cancelCreation);
  updateFields();
  return {
    dispose() {
      kind.removeEventListener("change", updateFields);
      form.removeEventListener("submit", submit);
      cancel.removeEventListener("click", cancelCreation);
      options.container.replaceChildren();
    },
  };
};

function mountMusicPlayer(container: HTMLElement): () => void {
  const audio = new Audio(new URL("./Cafe-hex.mp3", import.meta.url).href);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.2;
  container.className = "music-player";
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Background music");
  container.innerHTML = `
    <span class="music-note" aria-hidden="true">♫</span>
    <input class="music-volume" type="range" min="0" max="100" step="1"
      value="20" aria-label="Music volume" aria-valuetext="20%"
      title="Music volume: 20%">
    <button type="button" aria-label="Play music" title="Play music"
      aria-pressed="false">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 2v12l10-6z" />
      </svg>
    </button>
  `;
  const button = container.querySelector("button")!;
  const volume = container.querySelector("input")!;
  const icon = container.querySelector("path")!;

  function removeAutoStart(): void {
    document.removeEventListener("pointerdown", startOnInteraction);
    document.removeEventListener("keydown", startOnInteraction);
  }

  function updatePlayback(): void {
    const label = audio.paused ? "Play music" : "Pause music";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.setAttribute("aria-pressed", String(!audio.paused));
    icon.setAttribute(
      "d",
      audio.paused ? "M4 2v12l10-6z" : "M3 2h4v12H3z M9 2h4v12H9z",
    );
    if (!audio.paused) removeAutoStart();
  }

  function showError(): void {
    removeAutoStart();
    audio.pause();
    updatePlayback();
    button.title = "Music unavailable. Click to retry.";
  }

  async function playMusic(): Promise<void> {
    try {
      await audio.play();
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "AbortError")
      ) updatePlayback();
      else showError();
    }
  }

  function startOnInteraction(event: Event): void {
    if (!button.contains(event.target as Node)) void playMusic();
  }

  function togglePlayback(): void {
    removeAutoStart();
    if (audio.paused) void playMusic();
    else audio.pause();
  }

  function updateVolume(): void {
    audio.volume = Number(volume.value) / 100;
    volume.setAttribute("aria-valuetext", `${volume.value}%`);
    volume.title = `Music volume: ${volume.value}%`;
  }

  button.addEventListener("click", togglePlayback);
  volume.addEventListener("input", updateVolume);
  audio.addEventListener("play", updatePlayback);
  audio.addEventListener("pause", updatePlayback);
  audio.addEventListener("error", showError);
  document.addEventListener("pointerdown", startOnInteraction);
  document.addEventListener("keydown", startOnInteraction);
  void playMusic();
  return () => {
    removeAutoStart();
    button.removeEventListener("click", togglePlayback);
    volume.removeEventListener("input", updateVolume);
    audio.removeEventListener("play", updatePlayback);
    audio.removeEventListener("pause", updatePlayback);
    audio.removeEventListener("error", showError);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    container.replaceChildren();
  };
}

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
  const customToolContainer = document.createElement("div");
  customToolContainer.id = "custom-tool-form";
  customToolContainer.hidden = true;
  sidebar.append(toolsHeading, palette, selection, customToolContainer);

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
  redrawButton.title = "Repaint the current artwork without removing it.";
  const clearButton = addButton("Clear", true);
  clearButton.title = "Clear the artwork. Undo restores it.";
  const createToolButton = addButton("Create Tool");
  createToolButton.setAttribute("aria-controls", customToolContainer.id);
  createToolButton.setAttribute("aria-expanded", "false");
  const exportButton = addButton("Export PNG");

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
    }. White background.`;
  dimensions.title = dimensions.textContent;
  const exportStatus = document.createElement("p");
  exportStatus.setAttribute("role", "status");
  const musicPlayer = document.createElement("div");
  const disposeMusic = mountMusicPlayer(musicPlayer);
  const footer = document.createElement("div");
  footer.className = "canvas-footer";
  footer.append(dimensions, musicPlayer);
  drawingArea.append(controls, canvas, footer, exportStatus);
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
    clearButton.disabled = state.commands.length === 0;
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

  function clear(): void {
    input.cancelGesture();
    history.clear();
    redraw();
  }

  function closeToolForm(): void {
    customToolContainer.hidden = true;
    createToolButton.setAttribute("aria-expanded", "false");
    createToolButton.focus();
  }

  function openToolForm(): void {
    input.cancelGesture();
    customToolContainer.hidden = false;
    createToolButton.setAttribute("aria-expanded", "true");
    customToolContainer.querySelector("input")?.focus();
  }

  const customToolForm = mountCustomToolForm({
    container: customToolContainer,
    onCreate(tool) {
      input.cancelGesture();
      tools.add(tool);
      interaction.selectedToolId = tool.id;
      refreshPalette();
      closeToolForm();
    },
    onCancel: closeToolForm,
  });

  async function downloadPng(): Promise<void> {
    exportButton.disabled = true;
    exportStatus.textContent = "Preparing PNG...";
    try {
      await exportPng(
        { ...DOCUMENT_SETTINGS, commands: history.getState().commands },
        renderDocument,
      );
      exportStatus.textContent = "Exported PNG with a white background.";
    } catch (error) {
      exportStatus.textContent = error instanceof Error
        ? error.message
        : "Could not export the PNG image.";
    } finally {
      exportButton.disabled = false;
    }
  }

  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);
  redrawButton.addEventListener("click", redraw);
  clearButton.addEventListener("click", clear);
  createToolButton.addEventListener("click", openToolForm);
  exportButton.addEventListener("click", downloadPng);
  refreshPalette();
  redraw();

  return () => {
    input.dispose();
    undoButton.removeEventListener("click", undo);
    redoButton.removeEventListener("click", redo);
    redrawButton.removeEventListener("click", redraw);
    clearButton.removeEventListener("click", clear);
    createToolButton.removeEventListener("click", openToolForm);
    exportButton.removeEventListener("click", downloadPng);
    customToolForm.dispose();
    disposeMusic();
    app.replaceChildren();
  };
}

const app = document.querySelector<HTMLElement>("#app");
if (app) mountSketchpad(app);
