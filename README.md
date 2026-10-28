# Garden Postcard Sketchpad

[Open the app](https://kirikomeow.github.io/CMPM121_D2/) — draw lines, place text or emoji stickers, and export a postcard.

## Use

Click **Create Tool**, enter a name, choose Marker (color/width) or Sticker (text/size), then **Add Tool**. The new tool is selected automatically: drag to draw or click to stamp. Presets and palette buttons are not integrated yet, so earlier tools cannot be reselected.

**Undo/Redo** support multiple steps; a new drawing action discards redo. **Clear** empties the canvas and can be undone. **Redraw** repaints existing artwork. **Export PNG** downloads the active artwork at 1600 × 1200 with a white background, excluding undone marks and previews. Reloading loses the session.

## Developers: adding a rectangle tool

- [types.ts](src/types.ts): Add `RectangleTool` and `RectangleCommand` (geometry, color, line width, `render(context)`) to the tool/command unions; extend `CommandFactory` and widen both preview types to `DrawingCommand | null`.
- [core.ts](src/core.ts): Extend `createCommandFactory` to snapshot normalized rectangle geometry/style and render with context save/restore. Add a rectangle gesture and explicit branches in `attachCanvasInput`'s down/move/up handlers: preview while dragging, commit once on release, discard on cancellation.
- [presets.ts](src/presets.ts): Register the tool. Complete [palette.ts](src/palette.ts)'s `renderToolPalette` to list tools, mark selection, and call `onSelect(tool.id)`. For custom rectangles, extend [main.ts](src/main.ts)'s `mountCustomToolForm` options, fields, visibility, and submit validation.
- `createToolRegistry` and `mountSketchpad` already pass generic tools. `createHistoryStore` handles generic commands, so rectangle commits support Undo/Redo/Clear unchanged. `renderDocument` calls each command's renderer; `exportPng` reuses it on a separate scaled canvas without previews, so Redraw and export need no rectangle-specific changes.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.
