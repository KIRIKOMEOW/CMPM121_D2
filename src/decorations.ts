import type { DecorationCommand, ImageTool } from "./types.ts";

export const PAPER_STYLES = [
  "White",
  "Warm cream",
  "Blush",
  "Sky",
  "Mint",
  "Pink dots",
  "Blue dots",
];
export const BORDER_STYLES = ["None", "Airmail", "Double ink", "Garden"];
export const LAYOUT_STYLES = [
  "Free layout",
  "Message lines",
  "Classic address",
  "Letter paper",
];

export function decoration(
  slot: DecorationCommand["slot"],
  style: string,
): DecorationCommand {
  return Object.freeze({
    kind: "decoration",
    slot,
    style,
    render(ctx: CanvasRenderingContext2D) {
      ctx.save();
      try {
        if (slot === "background") {
          const colors: Record<string, string> = {
            White: "#ffffff",
            "Warm cream": "#fff6e5",
            Blush: "#fff0f3",
            Sky: "#eaf5ff",
            Mint: "#edf7ed",
            "Pink dots": "#fff9f5",
            "Blue dots": "#f3faff",
          };
          ctx.fillStyle = colors[style] ?? "#ffffff";
          ctx.fillRect(0, 0, 800, 600);
          if (style.includes("dots")) {
            ctx.fillStyle = style === "Pink dots" ? "#eeb9c5" : "#a7cce3";
            for (let y = 16; y < 600; y += 28) {
              for (let x = 16; x < 800; x += 28) {
                ctx.beginPath();
                ctx.arc(x + (y % 56 === 16 ? 0 : 14), y, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        } else if (slot === "border") {
          if (style === "Airmail") {
            ctx.lineWidth = 8;
            for (let x = 12; x < 788; x += 30) {
              ctx.strokeStyle = (Math.floor(x / 30) % 2)
                ? "#7daac2"
                : "#d77b91";
              ctx.beginPath();
              ctx.moveTo(x, 12);
              ctx.lineTo(Math.min(x + 17, 788), 12);
              ctx.moveTo(x, 588);
              ctx.lineTo(Math.min(x + 17, 788), 588);
              ctx.stroke();
            }
            for (let y = 12; y < 588; y += 30) {
              ctx.strokeStyle = (Math.floor(y / 30) % 2)
                ? "#7daac2"
                : "#d77b91";
              ctx.beginPath();
              ctx.moveTo(12, y);
              ctx.lineTo(12, y + 17);
              ctx.moveTo(788, y);
              ctx.lineTo(788, y + 17);
              ctx.stroke();
            }
          } else if (style === "Double ink") {
            ctx.strokeStyle = "#6b785e";
            ctx.lineWidth = 2;
            ctx.strokeRect(16, 16, 768, 568);
            ctx.lineWidth = 1;
            ctx.strokeRect(23, 23, 754, 554);
          } else if (style === "Garden") {
            ctx.strokeStyle = "#88a88b";
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 20, 760, 560);
            for (const [x, y] of [[30, 30], [770, 30], [30, 570], [770, 570]]) {
              ctx.fillStyle = "#e8a9b9";
              for (let a = 0; a < 6; a++) {
                ctx.beginPath();
                ctx.arc(
                  x + Math.cos(a * Math.PI / 3) * 9,
                  y + Math.sin(a * Math.PI / 3) * 9,
                  6,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }
              ctx.fillStyle = "#f0cf76";
              ctx.beginPath();
              ctx.arc(x, y, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else {
          ctx.strokeStyle = "#a9b4b6";
          ctx.lineWidth = 1;
          const line = (x: number, y: number, width: number) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.stroke();
          };
          if (style === "Classic address") {
            ctx.beginPath();
            ctx.moveTo(440, 65);
            ctx.lineTo(440, 535);
            ctx.stroke();
            for (let y = 300; y <= 480; y += 60) line(485, y, 245);
            ctx.setLineDash([4, 5]);
            ctx.strokeRect(650, 60, 85, 105);
            ctx.setLineDash([]);
            ctx.fillStyle = "#7d898a";
            ctx.font = "14px Georgia, serif";
            ctx.fillText("POST CARD", 490, 100);
          } else if (style === "Message lines") {
            for (let y = 290; y < 530; y += 48) line(70, y, 470);
          } else if (style === "Letter paper") {
            for (let y = 140; y < 540; y += 46) line(65, y, 670);
          }
        }
      } finally {
        ctx.restore();
      }
    },
  });
}

// Original vector postal motifs: scalable and crisp in exported postcards.
export async function postalTools(): Promise<ImageTool[]> {
  const designs = [
    {
      id: "botanical-post",
      name: "Botanical postmark",
      color: "#507667",
      shape:
        '<circle cx="75" cy="75" r="57"/><circle cx="75" cy="75" r="48"/><path d="M47 85q28-55 55 0M75 90V55m0 20-17-10m17 0 15-10"/><text x="75" y="44">GARDEN POST</text><text x="75" y="112">SPECIAL DELIVERY</text>',
    },
    {
      id: "airmail-post",
      name: "Airmail postmark",
      color: "#6689a8",
      shape:
        '<circle cx="62" cy="75" r="45"/><path d="m37 77 50-18-20 37-5-17zM107 54q10-10 20 0t20 0M107 74q10-10 20 0t20 0M107 94q10-10 20 0t20 0"/><text x="62" y="53">AIR MAIL</text><text x="62" y="108">BON VOYAGE</text>',
    },
    {
      id: "heart-post",
      name: "Love letter postmark",
      color: "#bd748e",
      shape:
        '<rect x="23" y="22" width="104" height="106" rx="12" stroke-dasharray="4 4"/><path d="M75 94 45 65Q36 40 58 43q13 0 17 15 6-15 20-15 24 0 14 25z"/><text x="75" y="115">SENT WITH LOVE</text>',
    },
    {
      id: "sun-post",
      name: "Sunshine postage",
      color: "#b7914f",
      shape:
        '<rect x="25" y="15" width="100" height="120" rx="3" stroke-dasharray="5 3"/><circle cx="75" cy="68" r="21"/><path d="M75 35v-8m0 74v-8m-33-25h-8m82 0h-8M51 44l-6-6m60 60-6-6m-48 0-6 6m60-60-6 6"/><text x="75" y="118">SUNSHINE · 25</text>',
    },
  ];
  return await Promise.all(designs.map(async (design) => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><g fill="none" stroke="${design.color}" stroke-width="2.4" stroke-linecap="round">${design.shape}</g><style>text{fill:${design.color};stroke:none;font:8px Georgia,serif;text-anchor:middle;letter-spacing:1px}</style></svg>`;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    return {
      id: design.id,
      label: design.name,
      kind: "image",
      image,
      width: 150,
      height: 150,
    };
  }));
}
