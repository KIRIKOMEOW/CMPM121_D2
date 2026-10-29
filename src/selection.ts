import type {
  DrawingCommand,
  HistoryStore,
  ImageCommand,
  Point,
  StickerCommand,
} from "./types.ts";

type ElementCommand = ImageCommand | StickerCommand;
interface SelectionOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  history: HistoryStore;
  isEnabled(): boolean;
  onChange(): void;
  onSelection?(command: ElementCommand | null, index: number | null): void;
  onPreview(commands: readonly DrawingCommand[]): void;
}

// Selection is UI state. Only completed edits enter the replayable document.
export function mountSelection(options: SelectionOptions) {
  const { stage, canvas, context, history } = options;
  const box = document.createElement("div");
  box.className = "element-selection";
  box.hidden = true;
  box.setAttribute("aria-label", "Selected element: drag to move");
  function handle(label: string, className: string, text: string) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.title = label;
    button.setAttribute("aria-label", label);
    box.append(button);
    return button;
  }
  const remove = handle("Delete selected element", "element-delete", "×");
  const resize = handle("Resize selected element", "element-resize", "↘");
  const rotate = handle("Rotate selected element", "element-rotate", "↻");
  stage.append(box);
  let index: number | null = null;
  let draft: ElementCommand | null = null;
  let gesture: {
    original: ElementCommand;
    start: Point;
    mode: "move" | "resize" | "rotate";
    pointer: number;
    changed: boolean;
  } | null = null;

  function rotatePoint(point: Point, angle: number): Point {
    return {
      x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
      y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
    };
  }
  function geometry(command: ElementCommand) {
    let width: number, height: number;
    if (command.kind === "image") {
      width = command.width;
      height = command.height;
    } else {
      context.save();
      context.font = `${command.size}px ${command.fontFamily ?? "system-ui"}`;
      width = Math.max(
        16,
        ...command.text.split("\n").map((line) =>
          context.measureText(line).width
        ),
      );
      height = command.size *
        (1 + (command.text.split("\n").length - 1) * 1.25);
      context.restore();
    }
    const offset = command.kind === "sticker" && command.align === "left"
      ? { x: width / 2, y: height / 2 }
      : {
        x: 0,
        y: command.kind === "sticker" ? (height - command.size) / 2 : 0,
      };
    const rotated = rotatePoint(offset, command.rotation ?? 0);
    return {
      width,
      height,
      offset,
      center: {
        x: command.position.x + rotated.x,
        y: command.position.y + rotated.y,
      },
    };
  }
  function current(): ElementCommand | null {
    const command = index === null ? null : history.getState().commands[index];
    return command && (command.kind === "image" || command.kind === "sticker")
      ? command
      : null;
  }
  function point(event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
  }
  function refresh(): void {
    const command = draft ?? current();
    options.onSelection?.(command, index);
    box.hidden = !options.isEnabled() || !command;
    if (!command) return;
    const { width, height, center } = geometry(command);
    box.style.left = `${center.x / canvas.width * 100}%`;
    box.style.top = `${center.y / canvas.height * 100}%`;
    box.style.width = `${width / canvas.width * 100}%`;
    box.style.height = `${height / canvas.height * 100}%`;
    box.style.transform = `translate(-50%, -50%) rotate(${
      command.rotation ?? 0
    }rad)`;
  }
  function clear(): void {
    gesture = null;
    draft = null;
    index = null;
    box.hidden = true;
    options.onSelection?.(null, null);
  }
  function start(event: PointerEvent, mode: "move" | "resize" | "rotate") {
    const original = current();
    if (!original || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    gesture = {
      original,
      start: point(event),
      mode,
      pointer: event.pointerId,
      changed: false,
    };
    box.setPointerCapture(event.pointerId);
  }
  function select(event: PointerEvent) {
    if (!options.isEnabled() || event.button !== 0) return;
    const p = point(event);
    const commands = history.getState().commands;
    index = null;
    for (let i = commands.length - 1; i >= 0; i--) {
      const command = commands[i];
      if (command.kind !== "image" && command.kind !== "sticker") continue;
      const g = geometry(command);
      const local = rotatePoint(
        { x: p.x - g.center.x, y: p.y - g.center.y },
        -(command.rotation ?? 0),
      );
      if (
        Math.abs(local.x) <= g.width / 2 + 5 &&
        Math.abs(local.y) <= g.height / 2 + 5
      ) {
        index = i;
        break;
      }
    }
    refresh();
    if (index !== null) start(event, "move");
  }
  function down(event: PointerEvent) {
    if (event.target === remove) return;
    start(
      event,
      event.target === resize
        ? "resize"
        : event.target === rotate
        ? "rotate"
        : "move",
    );
  }
  function move(event: PointerEvent) {
    if (!gesture || gesture.pointer !== event.pointerId || index === null) {
      return;
    }
    const p = point(event), { original, start, mode } = gesture;
    const g = geometry(original);
    let position = original.position;
    let rotation = original.rotation ?? 0;
    let scale = 1;
    if (mode === "move") {
      position = {
        x: original.position.x + p.x - start.x,
        y: original.position.y + p.y - start.y,
      };
    } else {
      if (mode === "rotate") {
        rotation += Math.atan2(p.y - g.center.y, p.x - g.center.x) -
          Math.atan2(start.y - g.center.y, start.x - g.center.x);
      } else {scale = Math.max(
          0.15,
          Math.min(
            8,
            Math.hypot(p.x - g.center.x, p.y - g.center.y) /
              Math.max(
                1,
                Math.hypot(start.x - g.center.x, start.y - g.center.y),
              ),
          ),
        );}
      const offset = rotatePoint({
        x: g.offset.x * scale,
        y: g.offset.y * scale,
      }, rotation);
      position = { x: g.center.x - offset.x, y: g.center.y - offset.y };
    }
    draft = Object.freeze(
      original.kind === "image"
        ? {
          ...original,
          position: Object.freeze(position),
          rotation,
          width: original.width * scale,
          height: original.height * scale,
        }
        : {
          ...original,
          position: Object.freeze(position),
          rotation,
          size: original.size * scale,
        },
    );
    gesture.changed = Math.hypot(p.x - start.x, p.y - start.y) > 0.5;
    const commands = [...history.getState().commands];
    commands[index] = draft;
    options.onPreview(commands);
    refresh();
  }
  function up(event: PointerEvent) {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    if (draft && gesture.changed && index !== null) {
      const commands = [...history.getState().commands];
      commands[index] = draft;
      history.replace(commands);
    }
    gesture = null;
    draft = null;
    if (box.hasPointerCapture(event.pointerId)) {
      box.releasePointerCapture(event.pointerId);
    }
    options.onChange();
    refresh();
  }
  function cancel() {
    gesture = null;
    draft = null;
    options.onChange();
    refresh();
  }
  function deleteElement() {
    if (index === null || !current()) return;
    const commands = history.getState().commands.filter((_, i) => i !== index);
    clear();
    history.replace(commands);
    options.onChange();
  }
  function keyboard(event: KeyboardEvent) {
    const target = event.target;
    if (
      !options.isEnabled() ||
      target instanceof HTMLElement &&
        target.closest("input,textarea,select,[contenteditable=true]")
    ) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      if (index !== null) {
        event.preventDefault();
        deleteElement();
      }
    } else if (event.key === "Escape") {
      cancel();
      clear();
    }
  }
  canvas.addEventListener("pointerdown", select);
  box.addEventListener("pointerdown", down);
  box.addEventListener("pointermove", move);
  box.addEventListener("pointerup", up);
  box.addEventListener("pointercancel", cancel);
  remove.addEventListener("click", deleteElement);
  document.addEventListener("keydown", keyboard);
  const observer = new ResizeObserver(refresh);
  observer.observe(canvas);
  return {
    selectedIndex: () => index,
    select(value: number) {
      index = value;
      draft = null;
      refresh();
    },
    refresh,
    clear,
    dispose() {
      observer.disconnect();
      clear();
      box.remove();
      canvas.removeEventListener("pointerdown", select);
      box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerup", up);
      box.removeEventListener("pointercancel", cancel);
      remove.removeEventListener("click", deleteElement);
      document.removeEventListener("keydown", keyboard);
    },
  };
}
