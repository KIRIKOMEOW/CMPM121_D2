# Garden Postcard Sketchpad

[Open the app](https://kirikomeow.github.io/CMPM121_D2/) — draw lines, place text or emoji stickers, and export a postcard.

## Use

Templates are on the left, the postcard is in the middle, and creation tools are on the right (reflowed on small screens). Clear and Export PNG are above the postcard. Undo/Redo, Select, Add text, and Import PNG are in the editing toolbar.

- **Decorations:** use image tiles to choose from fifteen papers (including rice-paper fibers, linen, leaf watermarks, and vintage grain, and single large cat/dog/fern/ginkgo watermarks), three optional borders, and three optional writing layouts. Each change supports Undo/Redo. Eight original vector postal motifs and four illustrated postage stamps can be freely combined with emoji and imported PNGs.
- **Add text:** a text box appears on the canvas immediately. Type text or emoji; finish with Cmd/Ctrl+Enter or by clicking elsewhere. Single-click selects text for dragging. Double-click edits the existing text at its original position; there is no separate text-content field. Font family, size, and color controls appear above the canvas. Available fonts use local/system fallbacks.
- **Arrange:** newly placed text, emoji, and image stamps are selected automatically. Drag the selection to move it, drag the lower-right handle to resize, or drag the round handle to rotate. Click × or press Delete/Backspace to remove it. Use Select (V) to select another element. All completed edits support Undo/Redo; Esc cancels an active transform. Freehand strokes are edited with the eraser rather than individual selection boxes.
- **Brushes:** color and size controls sit directly under the Brushes heading, above visual presets. Choose fine, broad, soft airbrush, pen-pressure ink, Bling stars, Twinkle trail, or eraser, then draw. Pressure ink uses Pointer Events pressure on pen devices; a mouse uses fixed 0.65 pressure. Physical pen hardware has not been tested in this environment. Each brush remembers its settings during the session. The + beside Brushes saves the current brush as a reusable preset. The eraser reveals the current paper and writing layout.
- **Emoji:** 22 presets are included. The + tile after the last emoji opens a field directly inside the emoji group where you can type your own emoji and save it as a reusable stamp.
- **Postal code:** choose None, Red, Black, or Deep gold in the left template panel. Six fixed boxes appear near the top of the postcard; type directly into them or paste a six-character code. Changing the frame color preserves the entered code. Undo/Redo and export include postal codes.
- **Import PNG:** create a reusable stamp from a local PNG (up to 10 MB and 16 million pixels). Its initial longest side is capped at 120 document pixels; resize it on the canvas. Imported images remain on your device.
- **Export:** replay the current document into a separate 1600 × 1200 canvas. Paper, borders, layout, text, transformed stamps, and erasing are included; selection boxes, text editors, and toolbars are excluded.

Keyboard shortcuts: **V** Select, **B** last brush, **E** eraser, **T** new text, **[ / ]** brush/eraser size, **Cmd/Ctrl+Z** Undo, **Cmd/Ctrl+Shift+Z** Redo, **Cmd/Ctrl+Enter** finish text, **Esc** cancel, **Delete/Backspace** remove selected element. Editing shortcuts pause in text and form fields.

Reloading resets the session. Export before closing if you want to keep the finished postcard.

## Development and design

Use **Deno 2.9.7**, matching the deployment workflow and `.tool-versions`; older Deno formatters can produce CSS that CI rejects. Run `deno task dev` for Vite or `deno task ci` for formatting, lint, type checks, and a production build. The existing GitHub Pages workflow deploys pushes to `main`.

`types.ts` defines meaningful commands and tools. `core.ts` retains history, creates immutable drawing commands, and replays them into the supplied context. Paper/layout render below a transparent artwork surface; eraser commands remove artwork from that surface; borders render above it. The same path handles interactive redraw and higher-resolution export.

`selection.ts` keeps transient selection and gesture previews outside history. A completed transform or deletion records a replacement command list as one history action, preserving Undo/Redo and discarding stale redo branches. Rotation and dimensions live on the retained commands. `decorations.ts` defines paper, borders, writing layouts, and original SVG postal motifs; no external artwork is fetched. `palette.ts` renders ordinary and user-created tools through the same callback.

The design evolved from an empty palette, to small preset previews, to an explicit postcard composition workflow. The latest revision removes the generic Create Tool form and blend-mode controls in favor of contextual text formatting, direct object handles, and selectable postal decorations. Users can still create meaningful tools through brush presets, emoji, text, and imported PNGs.

Manual verification covers direct text entry, font selection, decoration composition, stamp scaling/rotation, deletion and undo recovery, PNG import/export, invalid PNG rejection, and eraser undo. Run the CI task before publishing.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.

Preset and palette implementation assisted by Codex (OpenAI GPT-6). Commit trailers identify assisted changes.

## Revision verification

The dock revision was checked in a local browser: placing an emoji, erasing its center and undoing the erase, creating a text tool, importing and placing a transparent PNG, exporting a 1600 × 1200 PNG, and rejecting a file with a `.png` extension but invalid contents. Formatting, lint, type checking, and production build run through `deno task ci`. Imported stamps and text remain session-only, like all other artwork.

## Brush asset provenance

The Bling and Twinkle brushes use `star_04.png` and `star_09.png` from **Kenney Particle Pack 1.1**, licensed **CC0**. Original asset page: https://kenney.nl/assets/particle-pack . Download mirror used: https://github.com/Calinou/kenney-particle-pack/tree/ab7086639ee73be31abd87feb21bf1402d4e8144/addons/kenney_particle_pack . The supplied license is preserved in `src/assets/brushes/LICENSE.txt`. These PNG tips are tinted and stamped along retained strokes, rather than importing Photoshop-specific ABR files. Soft/pressure rendering, paper textures, thumbnail layouts, postage artwork, and garden seals are project-authored. Sparkle scatter is deterministic so redraw and export match.
