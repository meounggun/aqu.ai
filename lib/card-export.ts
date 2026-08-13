/** 결과물 이미지 카드 내보내기 (PRD §8-1-3)
 *
 * AI 답변만을 폰트·테마가 적용된 디자인 카드로 그려 PNG로 저장하거나 클립보드에 복사한다.
 * 브랜드 헤더나 덱/절감 지표 같은 부가 정보는 넣지 않고 답변 본문만 담는다. */

export interface CardPayload {
  text: string;
}

const W = 1080;
const PAD = 72;
const BG = "#1b1d1f";
const CARD_BG = "#242628";

/** 주어진 폭에 맞춰 줄바꿈한 줄 배열을 반환 (\n 은 강제 개행) */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      out.push("");
      continue;
    }
    let line = "";
    // 한국어는 단어 경계가 넓어 글자 단위로 재는 편이 안정적이다
    for (const ch of paragraph) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxWidth && line) {
        out.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 카드를 캔버스에 그려 반환 — AI 답변 텍스트 하나만 담기고, 길이에 따라 높이가 늘어난다 */
export function renderCard(payload: CardPayload): HTMLCanvasElement {
  const { text } = payload;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const inner = W - PAD * 2;
  const bodyWidth = inner - 72; // 카드 내부 좌우 여백

  // 1차: 높이 계산을 위해 줄 수만 먼저 측정
  ctx.font = "400 30px Inter, -apple-system, system-ui, sans-serif";
  const lines = wrap(ctx, text.trim(), bodyWidth);
  const lineH = 48;
  const cardH = lines.length * lineH + 72;
  const H = cardH + PAD * 2;

  canvas.width = W;
  canvas.height = H;

  // 배경
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // 본문 카드 — 답변 텍스트만 담는다
  ctx.fillStyle = CARD_BG;
  roundRect(ctx, PAD, PAD, inner, cardH, 28);
  ctx.fill();

  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "400 30px Inter, -apple-system, system-ui, sans-serif";
  lines.forEach((line, i) => {
    ctx.fillText(line, PAD + 36, PAD + 36 + i * lineH);
  });

  return canvas;
}

function fileName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `aqu-ai-card-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`;
}

/** PNG로 즉시 다운로드 */
export function downloadCard(payload: CardPayload) {
  const canvas = renderCard(payload);
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName();
  a.click();
}

/** 클립보드로 복사 — 지원하지 않는 브라우저에서는 false */
export async function copyCard(payload: CardPayload): Promise<boolean> {
  try {
    const canvas = renderCard(payload);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob || typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
