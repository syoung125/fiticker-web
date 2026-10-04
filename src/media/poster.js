import {
  TYPES,
  recordIcon,
  DAYS,
  dateKey,
  summarize,
  duration,
  weekLabel,
  weekNumber,
} from '../domain/workouts.js';
import { loadImage } from './photo.js';
import { createIconRenderer } from './icon.js';
import { summaryModel, drawSummary, loadSummaryFonts, SUMMARY_HEIGHT } from './summary.js';
export async function createPoster(dates, records) {
  await Promise.allSettled([
    loadSummaryFonts(),
    document.fonts.load('800 100px Manrope'),
    document.fonts.load('500 28px "Noto Sans KR"'),
  ]);
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1920;
  const g = c.getContext('2d');
  const icon = createIconRenderer(g);
  const ink = '#20221d',
    muted = '#747968',
    lime = '#dfff7a';
  function rect(x, y, w, h, r, color) {
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  }
  function text(s, x, y, size = 24, weight = 500, color = ink, align = 'left') {
    g.fillStyle = color;
    g.font = `${weight} ${size}px "Manrope", "Noto Sans KR", sans-serif`;
    g.textAlign = align;
    g.textBaseline = 'alphabetic';
    g.fillText(s, x, y);
  }
  function line(y) {
    g.strokeStyle = '#d5d8c9';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(66, y);
    g.lineTo(1014, y);
    g.stroke();
  }
  function wrap(s, x, y, width, size = 24, maxLines = 2) {
    let row = '',
      rows = [];
    g.font = `500 ${size}px "Manrope", "Noto Sans KR", sans-serif`;
    for (const ch of Array.from(s)) {
      if (g.measureText(row + ch).width > width && row) {
        rows.push(row);
        row = ch;
      } else row += ch;
    }
    if (row) rows.push(row);
    rows.slice(0, maxLines).forEach((r, i) => text(r, x, y + i * (size + 8), size, 500, muted));
  }
  rect(0, 0, 1080, 1920, 0, '#f7f7ee');
  rect(66, 65, 39, 39, 20, lime);
  icon('↗', 66 + 39 / 2, 65 + 39 / 2, 31, ink);
  text('MOVE DIARY', 119, 95, 28, 800);
  text(`WEEK ${String(weekNumber(dates[0])).padStart(2, '0')}`, 1014, 95, 22, 500, ink, 'right');
  line(130);
  text('MY WEEK.', 57, 302, 130, 800);
  text(weekLabel(dates[0]), 70, 351, 25, 500, muted);
  text(
    `${dateKey(dates[0]).replaceAll('-', '.')} — ${dateKey(dates[6]).slice(5).replace('-', '.')}`,
    1014,
    351,
    21,
    500,
    muted,
    'right',
  );
  const summary = summarize(dates, records);
  drawSummary(g, summaryModel(dates, records), 66, 393);
  const summaryExtraHeight = SUMMARY_HEIGHT - 221;
  g.save();
  g.translate(0, summaryExtraHeight);
  const dayWidth = 948 / 7;
  dates.forEach((d, i) => {
    const x = 66 + i * dayWidth;
    const centerX = x + dayWidth / 2;
    const r = records[dateKey(d)];
    text(DAYS[i], centerX, 681, 17, 600, muted, 'center');
    text(String(d.getDate()), centerX, 725, 30, 600, ink, 'center');
    if (r) icon(recordIcon(r), centerX, 763, 35, ink);
    else text('—', centerX, 774, 26, 500, '#b4b8a7', 'center');
  });
  line(832);
  text('DAILY RECORDS', 66, 880, 20, 700);
  text(`${String(summary.count).padStart(2, '0')} MOVES`, 1014, 880, 18, 500, muted, 'right');
  const entries = dates.map((d, i) => ({ d, i, r: records[dateKey(d)] })).filter((e) => e.r);
  const cols = entries.length > 4 ? 3 : 2;
  const rows = Math.ceil(entries.length / cols);
  const gap = 20;
  const w = (948 - gap * (cols - 1)) / cols;
  const h = (rows === 1 ? 510 : rows === 2 ? 405 : 275) - summaryExtraHeight / rows;
  const photoH = (rows === 1 ? 270 : rows === 2 ? 192 : 102) - summaryExtraHeight / rows;
  for (let j = 0; j < entries.length; j++) {
    const { d, i, r } = entries[j],
      type = TYPES[r.type],
      x = 66 + (j % cols) * (w + gap),
      y = 907 + Math.floor(j / cols) * (h + gap);
    rect(x, y, w, h, 20, '#eeeee4');
    rect(x, y, w, photoH, 20, type.color);
    if (r.photo) {
      const img = await loadImage(r.photo);
      g.save();
      g.beginPath();
      g.roundRect(x, y, w, photoH, 20);
      g.clip();
      const scale = Math.max(w / img.width, photoH / img.height);
      const dw = img.width * scale,
        dh = img.height * scale;
      g.drawImage(img, x + (w - dw) / 2, y + (photoH - dh) / 2, dw, dh);
      g.restore();
    } else icon(recordIcon(r), x + w / 2, y + photoH / 2, rows === 3 ? 53 : 75, ink);
    rect(x + 12, y + 12, 102, 29, 8, '#ffffffeb');
    text(`${DAYS[i]} ${d.getDate()}`, x + 63, y + 33, 15, 700, ink, 'center');
    const inset = 20,
      titleY = y + photoH + 40;
    let titleSize = rows === 3 ? 25 : 31;
    g.font = `700 ${titleSize}px "Manrope", "Noto Sans KR", sans-serif`;
    while (g.measureText(r.name).width > w - 40 && titleSize > 13) {
      titleSize--;
      g.font = `700 ${titleSize}px "Manrope", "Noto Sans KR", sans-serif`;
    }
    text(r.name, x + inset, titleY, titleSize, 700);
    text(
      r.minutes === null ? '시간 미입력' : duration(r.minutes),
      x + inset,
      titleY + 34,
      20,
      500,
      muted,
    );
    if (r.memo) wrap(r.memo, x + inset, titleY + 74, w - 40, rows === 3 ? 19 : 23, 3);
  }
  g.restore();
  line(1828);
  text('EVERY MOVE COUNTS.', 66, 1875, 20, 700, muted);
  text('↗', 1014, 1880, 40, 500, ink, 'right');
  const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('이미지를 만들 수 없어요. 다시 시도해 주세요.');
  return blob;
}
