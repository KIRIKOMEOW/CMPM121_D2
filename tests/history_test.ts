import { createCommandFactory, createHistoryStore } from "../src/core.ts";
import { decoration } from "../src/decorations.ts";

function assert(value: boolean, message: string): void {
  if (!value) throw new Error(message);
}

Deno.test("postcard edits preserve transform history and discard stale redo", () => {
  const history = createHistoryStore();
  const paper = decoration("background", "Pink dots");
  const text = createCommandFactory().createSticker({ x: 100, y: 80 }, {
    id: "test-text",
    label: "Message",
    kind: "sticker",
    text: "Hello",
    size: 32,
  });
  history.commit(paper);
  history.commit(text);
  const rotated = Object.freeze({ ...text, rotation: Math.PI / 4, size: 64 });
  history.replace([paper, rotated]);
  history.undo();
  assert(
    history.getState().commands[1] === text,
    "Undo must restore original geometry",
  );
  history.redo();
  assert(
    history.getState().commands[1] === rotated,
    "Redo must restore transformed text",
  );
  history.replace([paper]);
  history.undo();
  assert(
    history.getState().commands[1] === rotated,
    "Deleting then undoing must restore the element",
  );
  history.replace([decoration("background", "Mint"), rotated]);
  assert(
    !history.getState().canRedo,
    "A new decoration edit must discard old redo",
  );
  history.clear();
  history.undo();
  assert(
    history.getState().commands.length === 2,
    "Undo Clear must restore paper and content",
  );
});

Deno.test("pen pressure is retained and changes the rendered brush radius", () => {
  const points = [{ x: 0, y: 0, pressure: 0.1 }, { x: 30, y: 0, pressure: 1 }];
  const command = createCommandFactory().createStroke(points, {
    id: "pressure",
    label: "Pressure",
    kind: "marker",
    color: "#123456",
    width: 20,
    brush: "pressure",
  });
  points[0].pressure = 1;
  assert(
    command.points[0].pressure === 0.1,
    "Commands must snapshot pen pressure",
  );
  const radii: number[] = [];
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    fill() {},
    arc(_x: number, _y: number, radius: number) {
      radii.push(radius);
    },
  } as unknown as CanvasRenderingContext2D;
  command.render(context);
  assert(
    Math.min(...radii) < 2 && Math.max(...radii) > 9,
    "Pressure must control stroke thickness",
  );
});

Deno.test("postal code renders six fixed boxes and retained characters", () => {
  const boxes: number[][] = [];
  const labels: string[] = [];
  const ctx = {
    save() {},
    restore() {},
    strokeRect(...args: number[]) {
      boxes.push(args);
    },
    fillText(value: string) {
      labels.push(value);
    },
  } as unknown as CanvasRenderingContext2D;
  decoration("postcode", "Red", "310000").render(ctx);
  assert(boxes.length === 6, "Postal code must contain six frames");
  assert(
    labels.slice(0, 6).join("") === "310000",
    "Export must include the actual postal code",
  );
});
