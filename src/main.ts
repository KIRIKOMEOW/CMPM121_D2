import {
  BORDER_STYLES,
  decoration,
  LAYOUT_STYLES,
  PAPER_STYLES,
  postalTools,
} from "./decorations.ts";
import { mountSelection } from "./selection.ts";
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
  DecorationCommand,
  InteractionState,
  PaletteRenderer,
  Point,
  StickerCommand,
  ToolDefinition,
} from "./types.ts";
import { renderToolPalette } from "./palette.ts";

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
  sidebar.className = "tool-dock";
  const toolsHeading = document.createElement("h2");
  toolsHeading.textContent = "Tools";
  const palette = document.createElement("div");
  palette.className = "tool-palette";
  const selection = document.createElement("p");
  selection.setAttribute("aria-live", "polite");
  sidebar.append(toolsHeading, palette, selection);

  const drawingArea = document.createElement("section");
  const controls = document.createElement("div");
  controls.className = "controls canvas-actions";
  const dockActions = document.createElement("div");
  dockActions.className = "dock-actions";
  const moveButton = document.createElement("button");
  moveButton.type = "button";
  moveButton.textContent = "↖ Select";
  moveButton.title = "Select and arrange elements (V)";
  dockActions.append(moveButton);
  const textButton = document.createElement("button");
  textButton.type = "button";
  textButton.textContent = "＋ Add text";
  dockActions.append(textButton);
  sidebar.prepend(dockActions);
  function addButton(label: string, disabled = false): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    controls.append(button);
    return button;
  }
  function iconButton(
    label: string,
    path: string,
    disabled = false,
  ): HTMLButtonElement {
    const button = addButton(label, disabled);
    button.className = "icon-button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.textContent = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const shape = document.createElementNS(svg.namespaceURI, "path");
    shape.setAttribute("d", path);
    svg.append(shape);
    button.append(svg);
    return button;
  }
  const undoButton = iconButton(
    "Undo",
    "M9 4 4 9l5 5 M4 9h9a7 7 0 0 1 0 14",
    true,
  );
  const redoButton = iconButton(
    "Redo",
    "m15 4 5 5-5 5 M20 9h-9a7 7 0 0 0 0 14",
    true,
  );
  const redrawButton = iconButton("Redraw", "M20 8a8 8 0 1 0 0 8 M20 3v5h-5");
  redrawButton.title = "Repaint the current artwork without removing it.";
  const clearButton = addButton("Clear", true);
  clearButton.title = "Clear the artwork. Undo restores it.";
  const importButton = addButton("Import PNG");
  importButton.title = "Import a PNG as a reusable stamp";
  const exportButton = addButton("Export PNG");
  exportButton.className = "primary-action";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,.png";
  fileInput.hidden = true;
  fileInput.setAttribute("aria-label", "Import PNG stamp");
  controls.append(fileInput);
  dockActions.append(undoButton, redoButton, redrawButton, importButton);

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
  dimensions.title = dimensions.textContent;
  const exportStatus = document.createElement("p");
  exportStatus.setAttribute("role", "status");
  const musicPlayer = document.createElement("div");
  const disposeMusic = mountMusicPlayer(musicPlayer);
  const footer = document.createElement("div");
  footer.className = "canvas-footer";
  footer.append(dimensions, musicPlayer);
  const stage = document.createElement("div");
  stage.className = "canvas-stage";
  stage.append(canvas);
  drawingArea.append(controls, stage, footer, exportStatus);
  layout.append(drawingArea, sidebar);
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
    for (const [slot, select] of decorationSelectors) {
      const command = state.commands.find((item) =>
        item.kind === "decoration" && item.slot === slot
      );
      select.value = command?.kind === "decoration"
        ? command.style
        : slot === "background"
        ? "White"
        : slot === "border"
        ? "None"
        : "Free layout";
    }
    selectionController?.refresh();
  }

  let textMode = false;
  let moveMode = false;
  let textEditor: HTMLTextAreaElement | null = null;
  let textPosition: Point | null = null;
  let lastBrushId = "fine-marker";
  const overrides = new Map<string, ToolDefinition>();
  function selectedTool(): ToolDefinition | undefined {
    const id = interaction.selectedToolId;
    return id ? overrides.get(id) ?? tools.getById(id) : undefined;
  }
  const settings = document.createElement("div");
  settings.className = "brush-settings";
  function setting(label: string, element: HTMLElement): void {
    const wrapper = document.createElement("label");
    wrapper.textContent = label;
    wrapper.append(element);
    settings.append(wrapper);
  }
  const ink = document.createElement("input");
  ink.type = "color";
  ink.value = "#356b3f";
  setting("Color", ink);
  const brushSize = document.createElement("input");
  brushSize.type = "number";
  brushSize.min = "1";
  brushSize.max = "128";
  brushSize.value = "3";
  setting("Size (px)", brushSize);
  const shortcuts = document.createElement("details");
  const shortcutHeading = document.createElement("summary");
  shortcutHeading.textContent = "Keyboard shortcuts";
  const shortcutText = document.createElement("p");
  shortcutText.textContent =
    "V Select · B Brush · E Eraser · T Text · [ / ] Size · Cmd/Ctrl+Z Undo · Cmd/Ctrl+Shift+Z Redo · Cmd/Ctrl+Enter Finish text · Esc Cancel · Delete/Backspace Remove selected element. Shortcuts pause while typing in a field.";
  shortcuts.append(shortcutHeading, shortcutText);
  sidebar.append(settings, shortcuts);

  function syncSettings(): void {
    const tool = selectedTool();
    const brush = !textMode &&
      (tool?.kind === "marker" || tool?.kind === "eraser");
    settings.hidden = moveMode || (!brush && !textMode);
    brushSize.value = textMode
      ? "32"
      : tool?.kind === "marker" || tool?.kind === "eraser"
      ? String(tool.width)
      : "32";
    ink.disabled = tool?.kind === "eraser" && !textMode;

    if (tool?.kind === "marker" && !textMode) {
      ink.value = tool.color;
    }
    canvas.style.cursor = moveMode
      ? "default"
      : textMode
      ? "text"
      : "crosshair";
    moveButton.setAttribute("aria-pressed", String(moveMode));
    textButton.setAttribute("aria-pressed", String(textMode));
  }
  function changeSettings(): void {
    const size = Math.max(1, Math.min(128, Number(brushSize.value) || 1));
    brushSize.value = String(size);
    if (textMode) {
      if (textEditor) {
        textEditor.style.color = ink.value;
        textEditor.style.fontSize = `${
          size * canvas.clientWidth / canvas.width
        }px`;
      }
      return;
    }
    const tool = selectedTool();
    if (tool?.kind === "marker") {
      overrides.set(tool.id, {
        ...tool,
        width: size,
        color: ink.value,
      });
    } else if (tool?.kind === "eraser") {
      overrides.set(tool.id, { ...tool, width: size });
    }
    refreshPalette();
  }
  for (const control of [ink, brushSize]) {
    control.addEventListener("input", changeSettings);
  }

  const input = attachCanvasInput({
    canvas,
    documentSize: DOCUMENT_SETTINGS,
    commands: createCommandFactory(),
    getSelectedTool: () => textMode || moveMode ? undefined : selectedTool(),
    onPreviewChange(preview) {
      interaction.preview = preview;
      redraw();
    },
    onCommit(command) {
      history.commit(command);
      if (command.kind !== "stroke") {
        moveMode = true;
        textMode = false;
        selectionController?.select(history.getState().commands.length - 1);
        refreshPalette();
      }
      redraw();
    },
  });

  function refreshPalette(): void {
    drawPalette(
      palette,
      tools.getAll().map((tool) => overrides.get(tool.id) ?? tool),
      textMode || moveMode ? null : interaction.selectedToolId,
      (toolId) => {
        if (!tools.getById(toolId)) return;
        finishText();
        input.cancelGesture();
        textMode = false;
        moveMode = false;
        selectionController?.clear();
        interaction.selectedToolId = toolId;
        if (selectedTool()?.kind === "marker") lastBrushId = toolId;
        refreshPalette();
      },
    );
    const selected = interaction.selectedToolId
      ? tools.getById(interaction.selectedToolId)
      : undefined;
    selection.textContent = moveMode
      ? "Select · drag, resize, rotate or delete"
      : textMode
      ? "Text · click the canvas to type"
      : selected
      ? `Selected tool: ${selected.label}`
      : "No tool selected.";
    syncSettings();
    const emojiHeading = palette.querySelector(
      '[aria-label="Emoji & stamps"] h3',
    );
    const brushHeading = palette.querySelector('[aria-label="Brushes"] h3');
    function plus(heading: Element | null, label: string, action: () => void) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "+";
      button.title = label;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", action);
      heading?.append(button);
    }
    plus(emojiHeading, "Add emoji", () => {
      emojiForm.hidden = !emojiForm.hidden;
      if (!emojiForm.hidden) emojiInput.focus();
    });
    plus(brushHeading, "Save brush preset", saveBrush);
  }

  function undo(): void {
    finishText();
    selectionController?.clear();
    input.cancelGesture();
    history.undo();
    redraw();
  }

  function redo(): void {
    finishText();
    selectionController?.clear();
    input.cancelGesture();
    history.redo();
    redraw();
  }

  function clear(): void {
    finishText();
    selectionController?.clear();
    input.cancelGesture();
    history.clear();
    redraw();
  }

  async function downloadPng(): Promise<void> {
    finishText();
    exportButton.disabled = true;
    exportStatus.textContent = "Preparing PNG...";
    try {
      await exportPng(
        { ...DOCUMENT_SETTINGS, commands: history.getState().commands },
        renderDocument,
      );
      exportStatus.textContent = "Exported postcard PNG.";
    } catch (error) {
      exportStatus.textContent = error instanceof Error
        ? error.message
        : "Could not export the PNG image.";
    } finally {
      exportButton.disabled = false;
    }
  }

  function addText(): void {
    finishText();
    input.cancelGesture();
    textMode = true;
    moveMode = false;
    selectionController?.clear();
    refreshPalette();
    beginTextAt({ x: 85, y: 110 });
  }
  function finishText(cancel = false): void {
    if (!textEditor || !textPosition) return;
    const value = textEditor.value.trim();
    const point = textPosition;
    const editor = textEditor;
    textEditor = null;
    textPosition = null;
    editor.remove();
    if (!cancel && value) {
      const tool: ToolDefinition = {
        id: `text-${crypto.randomUUID()}`,
        label: value.slice(0, 24),
        kind: "sticker",
        text: value,
        size: Number(brushSize.value),
        color: ink.value,
        fontFamily: fontChoice.value,
        category: "text",
        align: "left",
      };
      tools.add(tool);
      history.commit(createCommandFactory().createSticker(point, tool));
      textMode = false;
      moveMode = true;
      selectionController?.select(history.getState().commands.length - 1);
      refreshPalette();
      redraw();
    }
  }
  function typeOnCanvas(event: MouseEvent): void {
    if (!textMode || moveMode) return;
    finishText();
    const rect = canvas.getBoundingClientRect();
    textPosition = {
      x: Math.max(
        0,
        Math.min(
          canvas.width - 20,
          (event.clientX - rect.left) * canvas.width / rect.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          canvas.height - 40,
          (event.clientY - rect.top) * canvas.height / rect.height,
        ),
      ),
    };
    beginTextAt(textPosition);
  }
  function beginTextAt(point: Point): void {
    const rect = canvas.getBoundingClientRect();
    textPosition = point;
    const editor = document.createElement("textarea");
    editor.className = "canvas-text-editor";
    editor.setAttribute("aria-label", "Canvas text");
    editor.placeholder = "Type text or emoji…";
    editor.maxLength = 500;
    editor.style.left = `${textPosition.x / canvas.width * 100}%`;
    editor.style.top = `${textPosition.y / canvas.height * 100}%`;
    editor.style.maxWidth = `${
      (canvas.width - textPosition.x) / canvas.width * 100
    }%`;
    editor.style.fontSize = `${
      Number(brushSize.value) * rect.width / canvas.width
    }px`;
    editor.style.color = ink.value;
    editor.style.fontFamily = fontChoice.value;
    editor.addEventListener("blur", () => finishText());
    editor.addEventListener("keydown", (key) => {
      if (key.key === "Escape") {
        key.preventDefault();
        finishText(true);
      } else if (key.key === "Enter" && (key.metaKey || key.ctrlKey)) {
        key.preventDefault();
        finishText();
      }
    });
    textEditor = editor;
    stage.append(editor);
    editor.focus();
  }
  const emojiForm = document.createElement("form");
  emojiForm.className = "emoji-form";
  emojiForm.hidden = true;
  const emojiInput = document.createElement("input");
  emojiInput.setAttribute("aria-label", "Your emoji");
  emojiInput.placeholder = "Type an emoji…";
  emojiInput.maxLength = 20;
  const emojiAdd = document.createElement("button");
  emojiAdd.textContent = "+";
  emojiAdd.setAttribute("aria-label", "Save emoji");
  emojiForm.append(emojiInput, emojiAdd);
  sidebar.append(emojiForm);
  function saveEmoji(event: SubmitEvent): void {
    event.preventDefault();
    const text = emojiInput.value.trim();
    if (!text) return;
    const tool: ToolDefinition = {
      id: `emoji-${crypto.randomUUID()}`,
      label: text,
      kind: "sticker",
      text,
      size: 48,
      category: "emoji",
    };
    tools.add(tool);
    interaction.selectedToolId = tool.id;
    textMode = false;
    moveMode = false;
    emojiInput.value = "";
    emojiForm.hidden = true;
    refreshPalette();
  }
  emojiForm.addEventListener("submit", saveEmoji);
  function saveBrush(): void {
    const tool = selectedTool();
    if (tool?.kind !== "marker") return;
    const saved = {
      ...tool,
      id: `brush-${crypto.randomUUID()}`,
      label: `Brush ${tool.width}px ${tool.color}`,
    };
    tools.add(saved);
    interaction.selectedToolId = saved.id;
    lastBrushId = saved.id;
    refreshPalette();
  }
  function keyboard(event: KeyboardEvent): void {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.closest("input, textarea, select, [contenteditable=true]"))
    ) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "v") {
      event.preventDefault();
      selectMode();
      return;
    }
    if (key === "t") {
      event.preventDefault();
      addText();
      return;
    }
    if (key === "b" || key === "e") {
      event.preventDefault();
      finishText();
      input.cancelGesture();
      textMode = false;
      moveMode = false;
      selectionController?.clear();
      interaction.selectedToolId = key === "b" ? lastBrushId : "eraser";
      refreshPalette();
      return;
    }
    if (key === "[" || key === "]") {
      const tool = selectedTool();
      if (!textMode && tool?.kind !== "marker" && tool?.kind !== "eraser") {
        return;
      }
      event.preventDefault();
      brushSize.value = String(
        Number(brushSize.value) + (key === "]" ? 2 : -2),
      );
      changeSettings();
    }
  }
  function selectMode(): void {
    finishText();
    input.cancelGesture();
    textMode = false;
    moveMode = true;
    refreshPalette();
  }
  const decorations = document.createElement("section");
  decorations.className = "decorations-panel";
  const decorationTitle = document.createElement("h3");
  decorationTitle.textContent = "Postcard decorations";
  decorations.append(decorationTitle);
  const decorationSelectors = new Map<
    DecorationCommand["slot"],
    HTMLSelectElement
  >();
  function decorationChoice(
    label: string,
    slot: DecorationCommand["slot"],
    styles: string[],
  ): void {
    const wrapper = document.createElement("label");
    wrapper.textContent = label;
    const select = document.createElement("select");
    for (const style of styles) {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = style;
      select.append(option);
    }
    select.addEventListener("change", () => {
      finishText();
      selectionController.clear();
      const commands = history.getState().commands.filter((command) =>
        command.kind !== "decoration" || command.slot !== slot
      );
      if (select.value !== "None" && select.value !== "Free layout") {
        if (slot === "background") {
          commands.unshift(decoration(slot, select.value));
        } else commands.push(decoration(slot, select.value));
      }
      history.replace(commands);
      redraw();
    });
    decorationSelectors.set(slot, select);
    wrapper.append(select);
    decorations.append(wrapper);
  }
  decorationChoice("Paper / background", "background", PAPER_STYLES);
  decorationChoice("Border", "border", BORDER_STYLES);
  decorationChoice("Writing layout", "layout", LAYOUT_STYLES);
  sidebar.insertBefore(decorations, palette);

  const textToolbar = document.createElement("div");
  textToolbar.className = "text-context-toolbar";
  textToolbar.hidden = true;
  textToolbar.setAttribute("role", "group");
  textToolbar.setAttribute("aria-label", "Text formatting");
  const fontChoice = document.createElement("select");
  fontChoice.setAttribute("aria-label", "Font family");
  for (
    const [value, label] of [
      ["system-ui", "Modern"],
      ["Georgia, serif", "Classic serif"],
      ['"Palatino Linotype", Palatino, serif', "Letterpress"],
      ['"Brush Script MT", cursive', "Handwritten"],
      ['"Courier New", monospace', "Typewriter"],
    ]
  ) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    fontChoice.append(option);
  }
  const fontSize = document.createElement("input");
  fontSize.type = "number";
  fontSize.min = "8";
  fontSize.max = "256";
  fontSize.setAttribute("aria-label", "Text size");
  const fontColor = document.createElement("input");
  fontColor.type = "color";
  fontColor.setAttribute("aria-label", "Text color");
  const textContent = document.createElement("textarea");
  textContent.rows = 2;
  textContent.maxLength = 500;
  textContent.setAttribute("aria-label", "Edit selected text");
  textToolbar.append(fontChoice, fontSize, fontColor, textContent);
  stage.append(textToolbar);
  let formattedIndex: number | null = null;
  function formatText(): void {
    if (formattedIndex === null) return;
    const commands = [...history.getState().commands];
    const command = commands[formattedIndex];
    if (command?.kind !== "sticker" || command.align !== "left") return;
    const size = Math.max(8, Math.min(256, Number(fontSize.value) || 32));
    commands[formattedIndex] = Object.freeze({
      ...command,
      text: textContent.value,
      size,
      color: fontColor.value,
      fontFamily: fontChoice.value,
    });
    history.replace(commands);
    redraw();
  }
  for (const control of [fontChoice, fontSize, fontColor, textContent]) {
    control.addEventListener("change", formatText);
  }
  function showTextFormatting(
    command: StickerCommand | null,
    index: number | null,
  ): void {
    textToolbar.hidden = !command || command.align !== "left";
    formattedIndex = textToolbar.hidden ? null : index;
    if (textToolbar.hidden || !command) return;
    fontChoice.value = command.fontFamily ?? "system-ui";
    fontSize.value = String(Math.round(command.size));
    fontColor.value = command.color ?? "#22372b";
    if (document.activeElement !== textContent) {
      textContent.value = command.text;
    }
  }
  moveButton.addEventListener("click", selectMode);
  const selectionController = mountSelection({
    stage,
    canvas,
    history,
    context,
    isEnabled: () => moveMode,
    onChange: redraw,
    onSelection: (command, index) =>
      showTextFormatting(command?.kind === "sticker" ? command : null, index),
    onPreview: (commands) =>
      renderDocument(context!, { ...DOCUMENT_SETTINGS, commands }),
  });
  canvas.addEventListener("click", typeOnCanvas);
  document.addEventListener("keydown", keyboard);

  const importedUrls = new Set<string>();
  let importing = false;
  let disposed = false;
  function choosePng(): void {
    fileInput.click();
  }
  async function importPng(): Promise<void> {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file || importing) return;
    if (file.size > 10 * 1024 * 1024) {
      exportStatus.textContent = "Choose a PNG smaller than 10 MB.";
      return;
    }
    importing = true;
    importButton.disabled = true;
    const url = URL.createObjectURL(file);
    try {
      const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (
        ![137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) =>
          signature[i] === byte
        )
      ) {
        throw new Error("Choose a valid PNG image.");
      }
      const image = new Image();
      image.src = url;
      await image.decode();
      if (
        !image.naturalWidth || !image.naturalHeight ||
        image.naturalWidth * image.naturalHeight > 16_000_000
      ) {
        throw new Error("Choose a PNG with at most 16 million pixels.");
      }
      if (disposed) return;
      // Keep the decoded image for command replay; no uploads are performed.
      const scale = Math.min(
        1,
        120 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const tool: ToolDefinition = {
        id: `png-${crypto.randomUUID()}`,
        label: file.name.replace(/\.png$/i, ""),
        kind: "image",
        image,
        width: image.naturalWidth * scale,
        height: image.naturalHeight * scale,
      };
      input.cancelGesture();
      tools.add(tool);
      importedUrls.add(url);
      interaction.selectedToolId = tool.id;
      textMode = false;
      refreshPalette();
      exportStatus.textContent =
        "PNG stamp ready. Click the canvas to place it; select it again to reuse.";
    } catch (error) {
      if (!disposed) {
        exportStatus.textContent = error instanceof Error
          ? error.message
          : "Could not import the PNG.";
      }
    } finally {
      // Successful imports retain their local URL for palette thumbnails.
      if (!importedUrls.has(url)) URL.revokeObjectURL(url);
      importing = false;
      if (!disposed) importButton.disabled = false;
    }
  }

  textButton.addEventListener("click", addText);
  importButton.addEventListener("click", choosePng);
  fileInput.addEventListener("change", importPng);
  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);
  redrawButton.addEventListener("click", redraw);
  clearButton.addEventListener("click", clear);

  exportButton.addEventListener("click", downloadPng);
  void postalTools().then((presets) => {
    if (disposed) return;
    for (const tool of presets) tools.add(tool);
    refreshPalette();
  }).catch(() => {
    if (!disposed) {
      exportStatus.textContent = "Postal decorations could not be loaded.";
    }
  });
  refreshPalette();
  redraw();

  return () => {
    disposed = true;
    for (const url of importedUrls) URL.revokeObjectURL(url);
    importedUrls.clear();
    textButton.removeEventListener("click", addText);
    importButton.removeEventListener("click", choosePng);
    fileInput.removeEventListener("change", importPng);
    input.dispose();
    undoButton.removeEventListener("click", undo);
    redoButton.removeEventListener("click", redo);
    redrawButton.removeEventListener("click", redraw);
    clearButton.removeEventListener("click", clear);

    exportButton.removeEventListener("click", downloadPng);
    finishText(true);
    selectionController?.dispose();
    for (const control of [fontChoice, fontSize, fontColor, textContent]) {
      control.removeEventListener("change", formatText);
    }
    moveButton.removeEventListener("click", selectMode);
    canvas.removeEventListener("click", typeOnCanvas);
    document.removeEventListener("keydown", keyboard);
    emojiForm.removeEventListener("submit", saveEmoji);
    for (const control of [ink, brushSize]) {
      control.removeEventListener("input", changeSettings);
    }
    disposeMusic();
    app.replaceChildren();
  };
}

const app = document.querySelector<HTMLElement>("#app");
if (app) mountSketchpad(app);
