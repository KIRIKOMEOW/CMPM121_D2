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
