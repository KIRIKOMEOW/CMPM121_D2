import type {
  AttachCanvasInput,
  CommandFactory,
  DocumentRenderer,
  DocumentSettings,
  DrawingCommand,
  ExportPng,
  HistoryStore,
  MarkerTool,
  Point,
  StickerCommand,
  StickerTool,
  StrokeCommand,
  ToolDefinition,
  ToolRegistry,
} from "./types.ts";

export const DOCUMENT_SETTINGS: DocumentSettings = Object.freeze({
  width: 800,
  height: 600,
  background: "#ffffff",
});

export const EXPORT_SCALE = 2;

// Presets and custom tools share the same registry.
export function createToolRegistry(
  initialTools: readonly ToolDefinition[],
): ToolRegistry {
  const tools = new Map<string, ToolDefinition>();
  const registry: ToolRegistry = {
    getAll: () => Array.from(tools.values()),
    getById: (id) => tools.get(id),
    add(tool) {
      if (tools.has(tool.id)) {
        throw new Error(`Duplicate tool id: ${tool.id}`);
      }
      tools.set(tool.id, Object.freeze({ ...tool }));
    },
  };

  for (const tool of initialTools) registry.add(tool);
  return registry;
}

export function createHistoryStore(): HistoryStore {
  const commands: DrawingCommand[] = [];
  let cursor = 0;

  return {
    getState() {
      return Object.freeze({
        commands: Object.freeze(commands.slice(0, cursor)),
        canUndo: cursor > 0,
        canRedo: cursor < commands.length,
      });
    },
    commit(command) {
      commands.splice(cursor);
      commands.push(command);
      cursor = commands.length;
    },
    undo() {
      if (cursor > 0) cursor--;
    },
    redo() {
      if (cursor < commands.length) cursor++;
    },
  };
}

export function createCommandFactory(): CommandFactory {
  return {
    createStroke(points, tool) {
      if (points.length === 0) {
        throw new Error("A stroke needs at least one point.");
      }
      const savedPoints = Object.freeze(
        points.map((point) => Object.freeze({ ...point })),
      );
      const command: StrokeCommand = {
        kind: "stroke",
        points: savedPoints,
        color: tool.color,
        width: tool.width,
        render(context) {
          context.save();
          try {
            context.strokeStyle = this.color;
            context.fillStyle = this.color;
            context.lineWidth = this.width;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.beginPath();
            const first = this.points[0];
            if (this.points.length === 1) {
              context.arc(first.x, first.y, this.width / 2, 0, Math.PI * 2);
              context.fill();
            } else {
              context.moveTo(first.x, first.y);
              for (const point of this.points.slice(1)) {
                context.lineTo(point.x, point.y);
              }
              context.stroke();
            }
          } finally {
            context.restore();
          }
        },
      };
      return Object.freeze(command);
    },
    createSticker(position, tool) {
      const command: StickerCommand = {
        kind: "sticker",
        position: Object.freeze({ ...position }),
        text: tool.text,
        size: tool.size,
        render(context) {
          context.save();
          try {
            context.font =
              `${this.size}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
            context.fillStyle = "#22372b";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(this.text, this.position.x, this.position.y);
          } finally {
            context.restore();
          }
        },
      };
      return Object.freeze(command);
    },
  };
}

export const renderDocument: DocumentRenderer = (
  context,
  document,
  preview = null,
) => {
  context.save();
  try {
    context.resetTransform();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.scale(
      context.canvas.width / document.width,
      context.canvas.height / document.height,
    );
    context.fillStyle = document.background;
    context.fillRect(0, 0, document.width, document.height);
    for (const command of document.commands) command.render(context);
    preview?.render(context);
  } finally {
    context.restore();
  }
};

export const exportPng: ExportPng = async (
  drawing,
  renderer,
  scale = EXPORT_SCALE,
) => {
  if (!Number.isFinite(scale) || scale < 2) {
    throw new Error("Export scale must be at least 2.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(drawing.width * scale);
  canvas.height = Math.round(drawing.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not available.");
  renderer(context, drawing);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not create the PNG image."));
    }, "image/png");
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "garden-postcard.png";
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

interface MarkerGesture {
  readonly kind: "marker";
  readonly pointerId: number;
  readonly tool: MarkerTool;
  readonly points: Point[];
}

interface StickerGesture {
  readonly kind: "sticker";
  readonly pointerId: number;
  readonly tool: StickerTool;
}

export const attachCanvasInput: AttachCanvasInput = (options) => {
  const { canvas, documentSize, commands, getSelectedTool } = options;
  let gesture: MarkerGesture | StickerGesture | null = null;

  function getPoint(event: PointerEvent): Point | null {
    if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return null;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left - canvas.clientLeft) *
      documentSize.width / canvas.clientWidth;
    const y = (event.clientY - bounds.top - canvas.clientTop) *
      documentSize.height / canvas.clientHeight;
    if (x < 0 || y < 0 || x > documentSize.width || y > documentSize.height) {
      return null;
    }
    return { x, y };
  }

  function appendPoint(active: MarkerGesture, point: Point): void {
    const previous = active.points[active.points.length - 1];
    if (previous.x !== point.x || previous.y !== point.y) {
      active.points.push(point);
    }
  }

  function cancelGesture(): void {
    if (!gesture) return;
    gesture = null;
    options.onPreviewChange(null);
  }

  function pointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary || gesture) return;
    const tool = getSelectedTool();
    const point = getPoint(event);
    if (!tool || !point) return;
    event.preventDefault();
    if (tool.kind === "marker") {
      gesture = {
        kind: "marker",
        pointerId: event.pointerId,
        tool: Object.freeze({ ...tool }),
        points: [point],
      };
      options.onPreviewChange(
        commands.createStroke(gesture.points, gesture.tool),
      );
    } else {
      gesture = {
        kind: "sticker",
        pointerId: event.pointerId,
        tool: Object.freeze({ ...tool }),
      };
    }
  }

  function pointerMove(event: PointerEvent): void {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const point = getPoint(event);
    if (!point || (event.buttons & 1) === 0) {
      cancelGesture();
      return;
    }
    if (gesture.kind === "marker") {
      appendPoint(gesture, point);
      options.onPreviewChange(
        commands.createStroke(gesture.points, gesture.tool),
      );
    }
  }

  function pointerUp(event: PointerEvent): void {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const point = getPoint(event);
    if (!point) {
      cancelGesture();
      return;
    }
    const completed = gesture;
    gesture = null;
    options.onPreviewChange(null);
    if (completed.kind === "marker") {
      appendPoint(completed, point);
      options.onCommit(commands.createStroke(completed.points, completed.tool));
    } else {
      options.onCommit(commands.createSticker(point, completed.tool));
    }
  }

  function pointerCancel(event: PointerEvent): void {
    if (gesture?.pointerId === event.pointerId) cancelGesture();
  }

  function keyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") cancelGesture();
  }

  function visibilityChange(): void {
    if (document.hidden) cancelGesture();
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointerleave", pointerCancel);
  canvas.addEventListener("pointercancel", pointerCancel);
  globalThis.addEventListener("blur", cancelGesture);
  document.addEventListener("keydown", keyDown);
  document.addEventListener("visibilitychange", visibilityChange);

  return {
    cancelGesture,
    dispose() {
      cancelGesture();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointerleave", pointerCancel);
      canvas.removeEventListener("pointercancel", pointerCancel);
      globalThis.removeEventListener("blur", cancelGesture);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("visibilitychange", visibilityChange);
    },
  };
};
