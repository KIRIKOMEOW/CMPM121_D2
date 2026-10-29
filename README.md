# Garden Postcard Sketchpad

[Open the app](https://kirikomeow.github.io/CMPM121_D2/) — draw lines, place text or emoji stickers, and export a postcard.

## Use

The top bar contains icon buttons for **Undo**, **Redo**, and **Redraw**, plus **Clear**, **Import PNG**, and **Export PNG**. Hover an icon for its name. The tools dock sits immediately below the canvas with smaller buttons grouped into **Text**, **Emoji & stamps**, and **Brushes**.

- **Brushes:** choose Fine pen (green, 3px), Broad pen (rose, 12px), or Eraser (28px), then drag. Erasing paints the fixed white document background and is recorded as a stroke, so Undo restores the previous content.
- **Emoji & stamps:** select one of 22 garden, animal, weather, and decorative emoji, then click the canvas. Emoji artwork depends on the device font.
- **Text:** click **Add text**, enter a tool name and text, choose a size, then **Add Tool**. Click the canvas to stamp it, and reselect it from Text to reuse it.
- **Custom tools:** **Create tool** is in the tools dock; choose Marker or Sticker to create another reusable tool. Text stickers go under Text; pictographic stickers go under Emoji & stamps.
- **PNG stamps:** **Import PNG** accepts a local PNG up to 10 MB and 16 million pixels. The image becomes a selected, reusable stamp with its aspect ratio preserved and longest side capped at 120 document pixels. Transparency is preserved over the white canvas. Invalid files show an error. Imports stay on your device; there is no server upload.

Tool buttons support Tab and Enter/Space and retain focus when selected. Hover to see the name and usage.
**Undo/Redo** support multiple steps; a new drawing action discards redo. **Clear** empties the canvas and can be undone. **Redraw** repaints existing artwork. **Export PNG** downloads the active artwork at 1600 × 1200 with a white background, excluding undone marks and previews. Reloading loses the session.

## Development and design

Run `deno task dev` for the local Vite preview. Run `deno task ci` for formatting, lint, type checks, and a production build. Pushing to `main` runs the existing GitHub Pages deployment workflow.

The retained command model in `core.ts` remains the source for canvas redraw and scaled export. `presets.ts` supplies ordinary `ToolDefinition` values, exactly like the custom-tool form. `palette.ts` renders all registered tools and reports selection through the existing callback; it does not draw or manage history.

The initial empty palette forced users to create a tool before making a mark and prevented returning to earlier tools. The revision adds seven garden presets, visual marker/sticker previews, pressed-state feedback, and a shared palette for custom tools. Native buttons preserve familiar keyboard interaction. No artwork is stored in the palette, and the canvas/history/export pipeline is unchanged. Emoji appearance depends on the device font.

Before release, check: both pen widths and eraser; emoji and PNG stamps; switching back to a previous tool; a custom marker and sticker; repeated Undo/Redo; Clear followed by Undo; and PNG export after undoing content. Refresh intentionally resets the session.

## Developers: adding a rectangle tool

- [types.ts](src/types.ts): Add `RectangleTool` and `RectangleCommand` (geometry, color, line width, `render(context)`) to the tool/command unions; extend `CommandFactory` and widen both preview types to `DrawingCommand | null`.
- [core.ts](src/core.ts): Extend `createCommandFactory` to snapshot normalized rectangle geometry/style and render with context save/restore. Add a rectangle gesture and explicit branches in `attachCanvasInput`'s down/move/up handlers: preview while dragging, commit once on release, discard on cancellation.
- [presets.ts](src/presets.ts): Register the tool. The shared [palette.ts](src/palette.ts) renderer already lists tools and calls `onSelect(tool.id)`; extend its preview branch to represent rectangles. For custom rectangles, extend [main.ts](src/main.ts)'s `mountCustomToolForm` options, fields, visibility, and submit validation.
- `createToolRegistry` and `mountSketchpad` already pass generic tools. `createHistoryStore` handles generic commands, so rectangle commits support Undo/Redo/Clear unchanged. `renderDocument` calls each command's renderer; `exportPng` reuses it on a separate scaled canvas without previews, so Redraw and export need no rectangle-specific changes.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.

Preset and palette implementation assisted by Codex (OpenAI GPT-6). Commit trailers identify assisted changes.

## Revision verification

The dock revision was checked in a local browser: placing an emoji, erasing its center and undoing the erase, creating a text tool, importing and placing a transparent PNG, exporting a 1600 × 1200 PNG, and rejecting a file with a `.png` extension but invalid contents. Formatting, lint, type checking, and production build run through `deno task ci`. Imported stamps and text remain session-only, like all other artwork.
