import type { DecorationCommand, ImageTool } from "./types.ts";

export const PAPER_STYLES = [
  "White",
  "Warm cream",
  "Blush",
  "Sky",
  "Mint",
  "Pink dots",
  "Blue dots",
  "Rice paper",
  "Linen",
  "Pressed leaves",
  "Vintage grain",
  "Cat silhouette · left",
  "Dog silhouette · right",
  "Fern silhouette · left",
  "Ginkgo silhouette · right",
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
  text = "",
): DecorationCommand {
  return Object.freeze({
    kind: "decoration",
    slot,
    style,
    text,
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
            "Rice paper": "#f5f0e3",
            "Linen": "#f0e8d6",
            "Pressed leaves": "#f3f5e9",
            "Vintage grain": "#e9dbc0",
          };
          ctx.fillStyle = colors[style] ?? "#ffffff";
          ctx.fillRect(0, 0, 800, 600);
          if (style.includes("silhouette")) {
            ctx.save();
            const left = style.includes("left");
            ctx.translate(left ? 190 : 610, 350);
            ctx.strokeStyle = "rgba(98,126,111,.15)";
            ctx.fillStyle = "rgba(98,126,111,.075)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            if (style.startsWith("Cat")) {
              ctx.moveTo(-68, -62);
              ctx.lineTo(-76, -143);
              ctx.lineTo(-24, -109);
              ctx.quadraticCurveTo(6, -120, 37, -105);
              ctx.lineTo(88, -142);
              ctx.lineTo(76, -56);
              ctx.bezierCurveTo(112, 23, 58, 46, 48, 71);
              ctx.bezierCurveTo(110, 120, 91, 196, 35, 211);
              ctx.bezierCurveTo(-51, 234, -120, 184, -96, 108);
              ctx.quadraticCurveTo(-71, 65, -47, 57);
              ctx.bezierCurveTo(-115, 40, -120, -26, -68, -62);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(45, 182);
              ctx.bezierCurveTo(172, 235, 163, 99, 119, 130);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(-57, -22);
              ctx.lineTo(-34, -18);
              ctx.moveTo(30, -18);
              ctx.lineTo(52, -23);
              ctx.moveTo(-10, 0);
              ctx.lineTo(2, 7);
              ctx.lineTo(13, 0);
              ctx.stroke();
            } else if (style.startsWith("Dog")) {
              ctx.moveTo(-63, -87);
              ctx.bezierCurveTo(-112, -120, -144, -52, -102, -7);
              ctx.lineTo(-70, -45);
              ctx.bezierCurveTo(-80, 30, -42, 56, -41, 67);
              ctx.bezierCurveTo(-104, 129, -72, 204, -14, 211);
              ctx.bezierCurveTo(77, 225, 116, 171, 79, 104);
              ctx.lineTo(44, 63);
              ctx.bezierCurveTo(95, 44, 107, 9, 75, -48);
              ctx.bezierCurveTo(124, -20, 131, -96, 92, -108);
              ctx.lineTo(51, -85);
              ctx.quadraticCurveTo(-7, -120, -63, -87);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(68, 172);
              ctx.quadraticCurveTo(150, 145, 123, 98);
              ctx.moveTo(-39, -29);
              ctx.lineTo(-30, -29);
              ctx.moveTo(31, -29);
              ctx.lineTo(40, -29);
              ctx.moveTo(-6, -7);
              ctx.lineTo(9, -7);
              ctx.lineTo(1, 4);
              ctx.closePath();
              ctx.stroke();
            } else if (style.startsWith("Fern")) {
              ctx.moveTo(0, 220);
              ctx.bezierCurveTo(-19, 72, -10, -82, 38, -180);
              ctx.stroke();
              for (let i = 0; i < 9; i++) {
                const y = 170 - i * 38, w = 83 - i * 6;
                ctx.beginPath();
                ctx.moveTo(-2, y);
                ctx.bezierCurveTo(-w, y - 4, -w - 14, y - 47, -w - 5, y - 55);
                ctx.quadraticCurveTo(-24, y - 44, -2, y);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, y - 8);
                ctx.bezierCurveTo(w, y - 13, w + 10, y - 65, w, y - 70);
                ctx.quadraticCurveTo(22, y - 46, 0, y - 8);
                ctx.fill();
                ctx.stroke();
              }
            } else {
              ctx.moveTo(0, 219);
              ctx.lineTo(0, 16);
              ctx.lineTo(-72, -40);
              ctx.moveTo(0, 77);
              ctx.lineTo(80, 18);
              ctx.stroke();
              for (
                const [x, y, flip] of [[-72, -40, -1], [80, 18, 1], [
                  0,
                  -100,
                  1,
                ]]
              ) {
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(flip, 1);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(-34, -50, -97, -65, -83, -123);
                ctx.quadraticCurveTo(-34, -155, 0, -100);
                ctx.quadraticCurveTo(37, -155, 85, -123);
                ctx.bezierCurveTo(102, -64, 35, -50, 0, 0);
                ctx.fill();
                ctx.stroke();
                for (let j = -3; j <= 3; j++) {
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(j * 21, -119);
                  ctx.stroke();
                }
                ctx.restore();
              }
            }
            ctx.restore();
          }
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
          if (["Rice paper", "Linen", "Vintage grain"].includes(style)) {
            ctx.strokeStyle = "rgba(116,98,63,.11)";
            ctx.lineWidth = 0.6;
            for (let i = 0; i < 1800; i++) {
              const x = (i * 137.508) % 800, y = (i * 71.37) % 600;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + 3 + Math.sin(i) * 7, y + Math.cos(i) * 2);
              ctx.stroke();
            }
            if (style === "Linen") {
              ctx.strokeStyle = "rgba(109,91,64,.08)";
              for (let x = 0; x < 800; x += 5) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 600);
                ctx.stroke();
              }
              for (let y = 0; y < 600; y += 5) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(800, y);
                ctx.stroke();
              }
            }
          }
          if (style === "Pressed leaves") {
            ctx.strokeStyle = "rgba(105,135,91,.12)";
            ctx.lineWidth = 1;
            for (let y = 30; y < 600; y += 90) {
              for (let x = 30; x < 800; x += 90) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(-.5);
                ctx.beginPath();
                ctx.ellipse(0, 0, 10, 23, 0, 0, Math.PI * 2);
                ctx.moveTo(0, -23);
                ctx.lineTo(0, 30);
                ctx.stroke();
                ctx.restore();
              }
            }
          }
        } else if (slot === "postcode") {
          const colors: Record<string, string> = {
            Red: "#b34e48",
            Black: "#3d3b36",
            "Deep gold": "#a18439",
          };
          ctx.strokeStyle = colors[style] ?? colors.Red;
          ctx.fillStyle = ctx.strokeStyle;
          ctx.lineWidth = 1.5;
          ctx.font = "20px Georgia, serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let i = 0; i < 6; i++) {
            ctx.strokeRect(55 + i * 35, 45, 28, 28);
            ctx.fillText(this.text?.[i] ?? "", 69 + i * 35, 60);
          }
          ctx.font = "9px system-ui";
          ctx.textAlign = "left";
          ctx.fillText("POSTAL CODE", 55, 84);
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
    {
      id: "fern-post",
      name: "Fern herbarium seal",
      color: "#59775d",
      shape:
        '<circle cx="75" cy="75" r="60" stroke-dasharray="2 4"/><circle cx="75" cy="75" r="54"/><path d="M70 111Q65 58 90 37M72 96l-23-15m23 4 24-18M73 73 55 58m22 4 22-12m-17 2-7-17"/><text x="75" y="27">HERBARIUM</text><text x="75" y="128">GARDEN ARCHIVE</text>',
    },
    {
      id: "ginkgo-post",
      name: "Ginkgo botanical seal",
      color: "#ae8d45",
      shape:
        '<path d="M75 110 53 73Q25 61 33 42q25 0 42 30 17-30 42-30 8 19-20 31zM75 72v38M48 48l27 24m27-24L75 72"/><rect x="18" y="16" width="114" height="118" rx="12"/><text x="75" y="124">GINKGO · MEMORY</text>',
    },
    {
      id: "leaf-post",
      name: "Leaf collector seal",
      color: "#56786e",
      shape:
        '<ellipse cx="75" cy="75" rx="60" ry="48"/><path d="M43 93Q42 45 110 43 110 95 43 93l56-40M61 76l-2-15m16 1 0-12M72 68l21 8m-35 8 16 6"/><text x="75" y="20">BOTANICAL SOCIETY</text><text x="75" y="138">COLLECT LITTLE JOYS</text>',
    },
    {
      id: "rose-post",
      name: "Rose garden emblem",
      color: "#ab7181",
      shape:
        '<path d="M75 12 91 25l21-1 4 21 18 13-10 20 3 23-22 6-12 20-21-8-22 6-10-20-21-8 6-22-9-21 20-12 6-21 22 3z"/><circle cx="75" cy="69" r="24"/><path d="M61 69q14-25 28 0-14 25-28 0m14 23v18m0-8-17-7m17 4 17-7"/><text x="75" y="43">ROSE GARDEN</text>',
    },
    {
      id: "postage-leaf",
      name: "Fern postage stamp",
      color: "#496e60",
      shape:
        '<path d="M20 15h110v120H20z" fill="#e3eddd" stroke-dasharray="3 4"/><rect x="29" y="25" width="92" height="88"/><path d="M72 100V42m0 45-22-13m22 0 23-14M72 62 55 50m17 1 14-15"/><text x="75" y="36">GARDEN POST</text><text x="75" y="126">FERN · 80</text>',
    },
    {
      id: "postage-bloom",
      name: "Cherry blossom postage",
      color: "#b87891",
      shape:
        '<path d="M20 15h110v120H20z" fill="#fbe7ed" stroke-dasharray="3 4"/><rect x="29" y="25" width="92" height="88"/><path d="M45 101 96 43m-27 30-17-26m29 13 21 3"/><circle cx="56" cy="50" r="12" fill="#f0b6ca"/><circle cx="87" cy="53" r="14" fill="#f0b6ca"/><circle cx="65" cy="82" r="10" fill="#f0b6ca"/><text x="75" y="126">BLOSSOM · 50</text>',
    },
    {
      id: "postage-sky",
      name: "Mountain garden postage",
      color: "#6688a5",
      shape:
        '<path d="M20 15h110v120H20z" fill="#e9f2f9" stroke-dasharray="3 4"/><rect x="29" y="25" width="92" height="88"/><circle cx="98" cy="48" r="12" fill="#edcc76"/><path d="m30 97 30-42 23 31 14-14 23 25z" fill="#a8c4ae"/><text x="75" y="126">DAYDREAM · 25</text>',
    },
    {
      id: "postage-butterfly",
      name: "Butterfly postage",
      color: "#92769f",
      shape:
        '<path d="M20 15h110v120H20z" fill="#f1e9f5" stroke-dasharray="3 4"/><rect x="29" y="25" width="92" height="88"/><path d="M75 100V52m0 15Q39 33 40 64q0 29 35 15 35 14 35-15 1-31-35 3M75 52l-9-10m9 10 9-10"/><text x="75" y="126">BUTTERFLY · 60</text>',
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

// Preview crops exaggerate identifying details; the postcard renderer is unchanged.
export function templatePreview(
  ctx: CanvasRenderingContext2D,
  slot: DecorationCommand["slot"],
  style: string,
): void {
  ctx.save();
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, 160, 120);
  if (style === "None" || style === "Free layout") {
    ctx.strokeStyle = "#a4aaa8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(80, 60, 26, 0, Math.PI * 2);
    ctx.moveTo(62, 78);
    ctx.lineTo(98, 42);
    ctx.stroke();
  } else if (slot === "border") {
    ctx.scale(2.7, 2.7);
    ctx.translate(-8, -8);
    decoration(slot, style).render(ctx);
  } else if (slot === "layout") {
    ctx.strokeStyle = "#7b8f98";
    ctx.lineWidth = 3;
    const line = (x: number, y: number, w: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.stroke();
    };
    if (style === "Classic address") {
      line(76, 12, 0);
      ctx.beginPath();
      ctx.moveTo(76, 12);
      ctx.lineTo(76, 108);
      ctx.stroke();
      ctx.strokeStyle = "#b3838c";
      ctx.strokeRect(120, 12, 24, 30);
      ctx.strokeStyle = "#7b8f98";
      for (let y = 64; y < 110; y += 18) line(90, y, 54);
      ctx.fillStyle = "#c4d0d2";
      ctx.fillRect(14, 25, 45, 5);
      ctx.fillRect(14, 38, 38, 5);
    } else if (style === "Message lines") {
      ctx.fillStyle = "#d1b9c2";
      ctx.beginPath();
      ctx.arc(128, 28, 13, 0, Math.PI * 2);
      ctx.fill();
      for (let y = 58; y <= 106; y += 16) line(16, y, 94);
    } else {
      ctx.strokeStyle = "#c29b9d";
      ctx.beginPath();
      ctx.moveTo(30, 10);
      ctx.lineTo(30, 110);
      ctx.stroke();
      ctx.strokeStyle = "#7b8f98";
      for (let y = 22; y < 110; y += 16) line(12, y, 136);
    }
  } else if (slot === "postcode") {
    ctx.scale(.68, .68);
    ctx.translate(-40, -28);
    decoration(slot, style, "123456").render(ctx);
  } else {
    // Show a close paper swatch, or a whole single-motif composition.
    ctx.scale(
      style.includes("silhouette") ? 0.2 : 1.3,
      style.includes("silhouette") ? 0.2 : 1.3,
    );
    decoration(slot, style).render(ctx);
    if (["Rice paper", "Linen", "Vintage grain"].includes(style)) {
      ctx.strokeStyle = style === "Vintage grain"
        ? "rgba(110,80,40,.25)"
        : "rgba(124,108,75,.22)";
      ctx.lineWidth = .8;
      for (let i = 0; i < 180; i++) {
        const x = (i * 37.3) % 125, y = (i * 19.7) % 95;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 7, y + Math.sin(i) * 3);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}
