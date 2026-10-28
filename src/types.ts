export interface Point {
  readonly x: number;
  readonly y: number;
}

interface ToolBase {
  readonly id: string;
  readonly label: string;
}

export interface MarkerTool extends ToolBase {
  readonly kind: "marker";
  readonly color: string;
  readonly width: number;
}

export interface StickerTool extends ToolBase {
  readonly kind: "sticker";
  readonly text: string;
  readonly size: number;
}

export type ToolDefinition = MarkerTool | StickerTool;

interface ReplayableCommand {
  // Use the supplied context; never capture the interactive canvas context.
  render(context: CanvasRenderingContext2D): void;
}

export interface StrokeCommand extends ReplayableCommand {
  readonly kind: "stroke";
  readonly points: readonly Point[];
  readonly color: string;
  readonly width: number;
}

export interface StickerCommand extends ReplayableCommand {
  readonly kind: "sticker";
  readonly position: Point;
  readonly text: string;
  readonly size: number;
}

export type DrawingCommand = StrokeCommand | StickerCommand;

export interface DocumentSettings {
  readonly width: number;
  readonly height: number;
  readonly background: string;
}

// A read-only view of active history, not a second mutable command collection.
export interface DrawingDocument extends DocumentSettings {
  readonly commands: readonly DrawingCommand[];
}

export interface InteractionState {
  selectedToolId: string | null;
  preview: StrokeCommand | null;
}

export type SelectTool = (toolId: string) => void;

export type PaletteRenderer = (
  container: HTMLElement,
  tools: readonly ToolDefinition[],
  selectedToolId: string | null,
  onSelect: SelectTool,
) => void;

export interface CommandFactory {
  createStroke(points: readonly Point[], tool: MarkerTool): StrokeCommand;
  createSticker(position: Point, tool: StickerTool): StickerCommand;
}

export interface HistoryState {
  readonly commands: readonly DrawingCommand[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

// Drawing commits and nonempty clears discard redo; each is one action.
export interface HistoryStore {
  getState(): HistoryState;
  commit(command: DrawingCommand): void;
  clear(): void;
  undo(): void;
  redo(): void;
}

// Display may supply a preview. Export uses the same renderer without one.
export type DocumentRenderer = (
  context: CanvasRenderingContext2D,
  document: DrawingDocument,
  preview?: DrawingCommand | null,
) => void;

export interface CanvasInputOptions {
  readonly canvas: HTMLCanvasElement;
  readonly documentSize: Pick<DocumentSettings, "width" | "height">;
  readonly commands: CommandFactory;
  readonly getSelectedTool: () => ToolDefinition | undefined;
  readonly onPreviewChange: (preview: StrokeCommand | null) => void;
  readonly onCommit: (command: DrawingCommand) => void;
}

export interface CanvasInputController {
  cancelGesture(): void;
  dispose(): void;
}

export type AttachCanvasInput = (
  options: CanvasInputOptions,
) => CanvasInputController;

export type ExportPng = (
  document: DrawingDocument,
  renderDocument: DocumentRenderer,
  scale?: number,
) => Promise<void>;

export interface ToolRegistry {
  getAll(): readonly ToolDefinition[];
  getById(id: string): ToolDefinition | undefined;
  add(tool: ToolDefinition): void;
}

export interface CustomToolOptions {
  readonly container: HTMLElement;
  readonly onCreate: (tool: ToolDefinition) => void;
  readonly onCancel?: () => void;
}

export type MountCustomToolForm = (
  options: CustomToolOptions,
) => { dispose(): void };
