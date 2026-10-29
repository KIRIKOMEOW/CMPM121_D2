import type { MarkerTool, StrokeCommand } from "./types.ts";

const tintedTips = new WeakMap<
  HTMLImageElement,
  Map<string, HTMLCanvasElement>
>();
function tipFor(image: HTMLImageElement, color: string): HTMLCanvasElement {
  let colors = tintedTips.get(image);
  if (!colors) {
    colors = new Map();
    tintedTips.set(image, colors);
  }
  let tip = colors.get(color);
  if (!tip) {
    tip = document.createElement("canvas");
    tip.width = tip.height = 128;
    const ctx = tip.getContext("2d")!;
    ctx.drawImage(image, 0, 0, 128, 128);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    colors.set(color, tip);
  }
  return tip;
}

// Each sample is a function of retained points: redraw/export never re-randomize.
export function renderFancyBrush(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeCommand,
): boolean {
  if (!stroke.brush || stroke.brush === "solid") return false;
  const step = stroke.brush === "sparkle"
    ? Math.max(5, stroke.width * 0.65)
    : Math.max(1, stroke.width * 0.08);
  let distance = 0, next = 0, sample = 0;
  function dab(x: number, y: number, pressure: number) {
    const size = stroke.width *
      (stroke.brush === "pressure" ? Math.max(0.08, pressure) : 1);
    ctx.save();
    if (stroke.brush === "soft") {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
      gradient.addColorStop(0, stroke.color);
      gradient.addColorStop(1, `${stroke.color}00`);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    } else if (stroke.brush === "sparkle" && stroke.tip) {
      const angle = Math.sin(sample * 78.233) * Math.PI;
      const scatter = Math.sin(sample * 12.9898) * size * 0.25;
      const varied = size *
        (0.45 + 0.5 * Math.abs(Math.sin(sample * 4.71 + 1)));
      ctx.translate(x, y + scatter);
      ctx.rotate(angle);
      ctx.drawImage(
        tipFor(stroke.tip, stroke.color),
        -varied / 2,
        -varied / 2,
        varied,
        varied,
      );
    } else {
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    sample++;
  }
  if (stroke.points.length === 1) {
    dab(
      stroke.points[0].x,
      stroke.points[0].y,
      stroke.points[0].pressure ?? 0.65,
    );
  } else {for (let i = 1; i < stroke.points.length; i++) {
      const a = stroke.points[i - 1],
        b = stroke.points[i],
        length = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= distance + length) {
        const t = length ? (next - distance) / length : 0;
        const pressure = (a.pressure ?? 0.65) * (1 - t) +
          (b.pressure ?? 0.65) * t;
        dab(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, pressure);
        next += step;
      }
      distance += length;
    }}
  return true;
}

export async function sparkleBrushes(): Promise<MarkerTool[]> {
  return await Promise.all([
    [
      "bling",
      "Bling stars",
      new URL("./assets/brushes/star_04.png", import.meta.url).href,
    ],
    [
      "twinkle",
      "Twinkle trail",
      new URL("./assets/brushes/star_09.png", import.meta.url).href,
    ],
  ].map(async ([id, label, src]) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return {
      id,
      label,
      kind: "marker",
      color: "#d49339",
      width: 56,
      brush: "sparkle",
      tip: image,
    } as MarkerTool;
  }));
}
