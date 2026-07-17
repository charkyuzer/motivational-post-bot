const { createCanvas, loadImage, GlobalFonts, Path2D } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '../assets');
try {
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Regular.ttf'), 'Inter');
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Medium.ttf'),  'Inter');
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Bold.ttf'),    'Inter');
} catch (err) {
  console.error('Font registration failed:', err.message);
}

const BG_DIR = path.join(ASSETS, 'backgrounds');
const GOLD   = '#C9A84C';
const W = 1024, H = 1024;
const OUT_M = 24, OUT_R = 30;

function getBgPath(id) {
  const idx = ((id - 1) % 30) + 1;
  const p = path.join(BG_DIR, `bg${idx}.png`);
  if (fs.existsSync(p)) return p;
  for (let i = 1; i <= 30; i++) {
    const fp = path.join(BG_DIR, `bg${i}.png`);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const test = cur + ' ' + words[i];
    if (ctx.measureText(test).width <= maxWidth) cur = test;
    else { lines.push(cur); cur = words[i]; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function getQuoteFontSize(text) {
  if (text.length > 180) return 44;
  if (text.length > 120) return 52;
  if (text.length > 70)  return 60;
  return 70;
}

// ── SVG Path helper ──────────────────────────────────────────
function drawSvgPath(ctx, pathStr, cx, cy, size, stroke = true, fill = false) {
  ctx.save();
  ctx.translate(cx, cy);
  const scale = (size * 2) / 24;
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);
  const p = new Path2D(pathStr);
  ctx.strokeStyle = GOLD;
  ctx.fillStyle   = GOLD;
  ctx.lineWidth   = 2.0 / scale;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  if (fill)   ctx.fill(p);
  if (stroke) ctx.stroke(p);
  ctx.restore();
}

// ── Fallback monogram ─────────────────────────────────────────
function drawMonogram(ctx, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.0;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = '700 36px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('T', cx - 9, cy - 4);
  ctx.fillText('M', cx + 9, cy + 8);
  ctx.restore();
}

// ── Mountain (top-right): 3 solid peaks + snow caps + sun rays ──
function drawMountain(ctx, cx, cy, size) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  const LIGHT  = GOLD;
  const DARK   = '#7A5E20';
  const SNOW   = '#E8DFC8';
  const RIDGE  = 'rgba(0,0,0,0.45)';
  const s = size;
  const baseY = cy + s * 0.55;

  // Sun rays
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.8;
  const sunCY = cy - s * 1.05;
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI * 0.88 + (i / 9) * Math.PI * 0.76;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * s * 0.22, sunCY + Math.sin(ang) * s * 0.22);
    ctx.lineTo(cx + Math.cos(ang) * s * 0.56, sunCY + Math.sin(ang) * s * 0.56);
    ctx.stroke();
  }
  ctx.restore();

  // Helper: draw one peak
  function peak(px, py, bl, br, snowH) {
    ctx.save();
    // Light (left) face
    ctx.fillStyle = LIGHT;
    ctx.beginPath();
    ctx.moveTo(bl, baseY); ctx.lineTo(px, py); ctx.lineTo(px, baseY);
    ctx.closePath(); ctx.fill();
    // Dark (right) face
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.moveTo(px, baseY); ctx.lineTo(px, py); ctx.lineTo(br, baseY);
    ctx.closePath(); ctx.fill();
    // Snow cap
    ctx.fillStyle = SNOW;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - snowH * 0.75, py + snowH);
    ctx.lineTo(px + snowH * 0.75, py + snowH);
    ctx.closePath(); ctx.fill();
    // Ridge lines
    ctx.strokeStyle = RIDGE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bl, baseY); ctx.lineTo(px, py); ctx.lineTo(br, baseY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px, baseY);
    ctx.stroke();
    ctx.restore();
  }

  // Left peak
  peak(cx - s * 0.42, cy - s * 0.05, cx - s * 0.82, cx - s * 0.10, s * 0.10);
  // Right peak
  peak(cx + s * 0.42, cy - s * 0.05, cx + s * 0.10, cx + s * 0.82, s * 0.10);
  // Center peak (tallest — drawn last so it overlaps)
  peak(cx, cy - s * 0.75, cx - s * 0.48, cx + s * 0.48, s * 0.22);

  // Base line
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.9, baseY);
  ctx.lineTo(cx + s * 0.9, baseY);
  ctx.stroke();

  ctx.restore();
}

// ── Compass Rose (bottom-left): solid shaded star ────────────
function drawCompass(ctx, cx, cy, size) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  const LIGHT  = GOLD;
  const DARK   = '#7A5E20';
  const RIDGE  = 'rgba(0,0,0,0.4)';

  function spike(angle, len, baseW) {
    const tx = cx + Math.cos(angle) * len;
    const ty = cy + Math.sin(angle) * len;
    const lx = cx + Math.cos(angle - Math.PI / 2) * baseW;
    const ly = cy + Math.sin(angle - Math.PI / 2) * baseW;
    const rx = cx + Math.cos(angle + Math.PI / 2) * baseW;
    const ry = cy + Math.sin(angle + Math.PI / 2) * baseW;
    // Light left half
    ctx.fillStyle = LIGHT;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(lx, ly); ctx.lineTo(tx, ty);
    ctx.closePath(); ctx.fill();
    // Dark right half
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(rx, ry); ctx.lineTo(tx, ty);
    ctx.closePath(); ctx.fill();
    // Outline
    ctx.strokeStyle = RIDGE;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lx, ly); ctx.lineTo(tx, ty); ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  // 4 cardinal spikes
  for (let i = 0; i < 4; i++) spike((i * Math.PI) / 2, size, size * 0.14);
  // 4 diagonal spikes (shorter)
  for (let i = 0; i < 4; i++) spike((i * Math.PI) / 2 + Math.PI / 4, size * 0.65, size * 0.09);

  // Inner ring
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2); ctx.stroke();

  // Center gold dot
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ── Pointed leaf helper ───────────────────────────────────────
function drawLeaf(ctx, x, y, angle, lw, lh) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lw * 0.4, lh * 0.6, lw, 0);
  ctx.quadraticCurveTo(lw * 0.4, -lh * 0.6, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Laurel branch (bottom-right) ─────────────────────────────
function drawLaurel(ctx, cx, cy, size) {
  ctx.save();

  const sx = cx - 8,  sy = cy + 30;
  const cpX = cx,     cpY = cy - 5;
  const ex  = cx + 14, ey = cy - 38;

  // Thick stem
  ctx.strokeStyle = GOLD;
  ctx.lineWidth   = 3.5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(cpX, cpY, ex, ey);
  ctx.stroke();

  // 8 pairs of leaves
  [0.06, 0.18, 0.32, 0.46, 0.60, 0.73, 0.85, 0.96].forEach((t) => {
    const mt   = 1 - t;
    const stemX = mt * mt * sx + 2 * mt * t * cpX + t * t * ex;
    const stemY = mt * mt * sy + 2 * mt * t * cpY + t * t * ey;
    const nt   = Math.min(t + 0.04, 1), nmt = 1 - nt;
    const nx   = nmt * nmt * sx + 2 * nmt * nt * cpX + nt * nt * ex;
    const ny   = nmt * nmt * sy + 2 * nmt * nt * cpY + nt * nt * ey;
    const ang  = Math.atan2(ny - stemY, nx - stemX) - Math.PI / 2;
    const lw   = size * 0.55, lh = size * 0.19;
    drawLeaf(ctx, stemX, stemY, ang - 0.78, lw, lh);
    drawLeaf(ctx, stemX, stemY, ang + 0.78, lw, lh);
  });

  ctx.restore();
}

// ── Blue verified badge ───────────────────────────────────────
function drawVerified(ctx, cx, cy, r) {
  ctx.save();
  ctx.fillStyle = '#1D9BF0';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy - r * 0.05);
  ctx.lineTo(cx - r * 0.1,  cy + r * 0.35);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.38);
  ctx.stroke();
  ctx.restore();
}

// ── Main export ───────────────────────────────────────────────
async function generateQuoteCard(quoteObj) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  const id       = quoteObj.id || 1;
  const quote    = quoteObj.quote    || '';
  const subtitle = quoteObj.subtitle || '';
  const title    = (quoteObj.title   || 'Daily Motivation').toUpperCase();

  // 1. Full-bleed background image
  const bgPath = getBgPath(id);
  let bgLoaded = false;
  if (bgPath) {
    try {
      const bgImg = await loadImage(bgPath);
      ctx.drawImage(bgImg, 0, 0, W, H);
      bgLoaded = true;
    } catch (e) { console.error('BG load failed:', e.message); }
  }
  if (!bgLoaded) { ctx.fillStyle = '#0D0D0D'; ctx.fillRect(0, 0, W, H); }

  // Global dark overlay — higher contrast
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.fillRect(0, 0, W, H);
  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, W*0.18, W/2, H/2, W*0.82);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  // 2. Outer gold border — shine gradient
  ctx.save();
  const outerShine = ctx.createLinearGradient(OUT_M, OUT_M, W - OUT_M, H - OUT_M);
  outerShine.addColorStop(0,    '#FFE97A');
  outerShine.addColorStop(0.25, '#C9A84C');
  outerShine.addColorStop(0.5,  '#FFE97A');
  outerShine.addColorStop(0.75, '#C9A84C');
  outerShine.addColorStop(1,    '#FFE97A');
  ctx.strokeStyle = outerShine; ctx.lineWidth = 3;
  roundRectPath(ctx, OUT_M, OUT_M, W - OUT_M * 2, H - OUT_M * 2, OUT_R);
  ctx.stroke();
  ctx.restore();

  // 3. TOP BAR — logo
  const logoPath = path.join(ASSETS, 'logo.png');
  const logoX = 88, logoY = 90, logoSize = 76;
  let logoLoaded = false;

  if (fs.existsSync(logoPath)) {
    try {
      const logoImg = await loadImage(logoPath);
      ctx.save();
      ctx.beginPath(); ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(logoImg, logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      logoLoaded = true;
    } catch (e) { console.error('logo.png error:', e.message); }
  }
  if (!logoLoaded) drawMonogram(ctx, logoX, logoY, logoSize / 2);

  // Handle: text first, then tick right next to it
  const handleX = logoX + (logoSize / 2) + 20;
  ctx.save();
  ctx.font = '700 25px Inter'; ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('@tonymotivation.bsky.social', handleX, logoY - 4);
  const hw = ctx.measureText('@tonymotivation.bsky.social').width;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2.0;
  ctx.beginPath(); ctx.moveTo(handleX, logoY + 18); ctx.lineTo(handleX + hw, logoY + 18); ctx.stroke();
  ctx.restore();
  const tickSize = 34;
  try {
    const tickImg = await loadImage(path.join(ASSETS, 'tick.png'));
    ctx.drawImage(tickImg, handleX + hw + 6, logoY - tickSize / 2, tickSize, tickSize);
  } catch (e) { drawVerified(ctx, handleX + hw + 20, logoY - 4, 13); }

  // Mountain top-right — real image, square aspect
  try {
    const mtnImg = await loadImage(path.join(ASSETS, 'mountain.png'));
    ctx.drawImage(mtnImg, W - 210, logoY - 90, 190, 190);
  } catch (e) { drawMountain(ctx, W - 110, logoY, 68); }

  // 4. TITLE ROW
  const titleY = 158;
  // Title lines — fade gradient
  ctx.save();
  const tLineL = ctx.createLinearGradient(OUT_M + 24, 0, W / 2 - 160, 0);
  tLineL.addColorStop(0, 'rgba(201,168,76,0.05)'); tLineL.addColorStop(1, '#C9A84C');
  ctx.strokeStyle = tLineL; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(OUT_M + 24, titleY); ctx.lineTo(W / 2 - 168, titleY); ctx.stroke();
  ctx.fillStyle = '#FFE97A';
  ctx.beginPath(); ctx.arc(W / 2 - 158, titleY, 4, 0, Math.PI * 2); ctx.fill();
  // Title text — bigger, glowing
  ctx.font = '700 32px Inter'; ctx.fillStyle = '#FFE97A';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#C9A84C'; ctx.shadowBlur = 22;
  ctx.fillText(title, W / 2, titleY);
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(W / 2 + 158, titleY, 4, 0, Math.PI * 2); ctx.fill();
  const tLineR = ctx.createLinearGradient(W / 2 + 168, 0, W - OUT_M - 24, 0);
  tLineR.addColorStop(0, '#C9A84C'); tLineR.addColorStop(1, 'rgba(201,168,76,0.05)');
  ctx.strokeStyle = tLineR; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 + 168, titleY); ctx.lineTo(W - OUT_M - 24, titleY); ctx.stroke();
  ctx.restore();

  // 5. INNER CARD — perfectly centered, symmetric
  const cardPad = 52; // equal on left and right
  const cardX = cardPad, cardY = 190, cardW = W - cardPad * 2, cardH = 580;

  // Card border — single gold shine
  ctx.save();
  const cardShine = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardShine.addColorStop(0,    '#FFE97A');
  cardShine.addColorStop(0.3,  '#C9A84C');
  cardShine.addColorStop(0.6,  '#FFE97A');
  cardShine.addColorStop(1,    '#C9A84C');
  ctx.strokeStyle = cardShine; ctx.lineWidth = 2.5;
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 20); ctx.stroke();
  ctx.restore();

  // 6. Opening quote mark
  ctx.save();
  ctx.font = 'italic 700 90px Georgia, "Times New Roman", serif';
  ctx.fillStyle = GOLD; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
  ctx.fillText('\u201C', cardX + 28, cardY + 24);
  ctx.restore();

  // 7. Closing quote mark
  ctx.save();
  ctx.font = 'italic 700 90px Georgia, "Times New Roman", serif';
  ctx.fillStyle = GOLD; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
  ctx.fillText('\u201D', cardX + cardW - 28, cardY + cardH - 24);
  ctx.restore();

  // 8. Quote text
  const centerY       = cardY + cardH / 2;
  const quoteFontSize = getQuoteFontSize(quote);
  const textMaxW      = cardW - 140;

  ctx.save();
  ctx.font = `700 ${quoteFontSize}px Inter`;
  ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 24;

  const qLines  = wrapText(ctx, quote, textMaxW);
  const qLH     = quoteFontSize * 1.25;
  const qTotalH = qLines.length * qLH;

  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  let subLines = [], subTotalH = 0;
  const subLH = 40;

  if (hasSubtitle) {
    ctx.save(); ctx.font = '700 28px Inter';
    subLines  = wrapText(ctx, subtitle, textMaxW - 40);
    subTotalH = subLines.length * subLH;
    ctx.restore();
  }

  const totalH  = hasSubtitle ? (qTotalH + 50 + subTotalH) : qTotalH;
  const qStartY = centerY - totalH / 2 + qLH / 2;
  qLines.forEach((line, i) => ctx.fillText(line.trim(), W / 2, qStartY + i * qLH));
  ctx.restore();

  // 9. Separator + subtitle
  if (hasSubtitle) {
    const sepY = centerY - totalH / 2 + qTotalH + 25;
    ctx.save();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(W / 2 - 70, sepY); ctx.lineTo(W / 2 + 70, sepY); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(W / 2, sepY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '700 28px Inter'; ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 16;
    subLines.forEach((line, i) => ctx.fillText(line.trim(), W / 2, sepY + 25 + i * subLH));
    ctx.restore();
  }

  // 10. BOTTOM BAR
  const botY = cardY + cardH + (H - OUT_M - (cardY + cardH)) / 2;

  // Compass — real image, bigger
  try {
    const compassImg = await loadImage(path.join(ASSETS, 'compass.png'));
    ctx.drawImage(compassImg, 18, H - OUT_M - 130, 130, 130);
  } catch (e) { drawCompass(ctx, 88, botY, 42); }

  // Footer icons + labels
  const iconSz = 13, gap = 28, labelGap = 10;
  ctx.save(); ctx.font = '700 22px Inter';
  const likeW = ctx.measureText('LIKE').width;
  const shareW = ctx.measureText('SHARE').width;
  const followW = ctx.measureText('FOLLOW').width;
  ctx.restore();

  const likeBlockW   = iconSz * 2 + labelGap + likeW;
  const shareBlockW  = iconSz * 2 + labelGap + shareW;
  const followBlockW = iconSz * 2 + labelGap + followW;
  const totalFooterW = likeBlockW + gap + 1 + gap + shareBlockW + gap + 1 + gap + followBlockW;
  let fx = W / 2 - totalFooterW / 2;

  const HEART_PATH    = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  const PLANE_PATH    = "M22 2L11 13M22 2l-7 20-4-9-9-4Z";
  const BOOKMARK_PATH = "M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z";

  // LIKE
  drawSvgPath(ctx, HEART_PATH, fx + iconSz, botY, iconSz, true, false);
  ctx.save(); ctx.font = '700 22px Inter'; ctx.fillStyle = '#F5F0E8';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('LIKE', fx + iconSz * 2 + labelGap, botY); ctx.restore();
  fx += likeBlockW + gap;

  ctx.save(); ctx.strokeStyle = 'rgba(201,168,76,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(fx, botY - 16); ctx.lineTo(fx, botY + 16); ctx.stroke();
  ctx.restore(); fx += 1 + gap;

  // SHARE
  drawSvgPath(ctx, PLANE_PATH, fx + iconSz, botY, iconSz, true, false);
  ctx.save(); ctx.font = '700 22px Inter'; ctx.fillStyle = '#F5F0E8';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('SHARE', fx + iconSz * 2 + labelGap, botY); ctx.restore();
  fx += shareBlockW + gap;

  ctx.save(); ctx.strokeStyle = 'rgba(201,168,76,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(fx, botY - 16); ctx.lineTo(fx, botY + 16); ctx.stroke();
  ctx.restore(); fx += 1 + gap;

  // FOLLOW
  drawSvgPath(ctx, BOOKMARK_PATH, fx + iconSz, botY, iconSz, false, true);
  ctx.save(); ctx.font = '700 22px Inter'; ctx.fillStyle = '#F5F0E8';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('FOLLOW', fx + iconSz * 2 + labelGap, botY); ctx.restore();

  // Leaf/Laurel — real image, bigger
  try {
    const leafImg = await loadImage(path.join(ASSETS, 'leaf.png'));
    ctx.drawImage(leafImg, W - 148, H - OUT_M - 130, 130, 130);
  } catch (e) { drawLaurel(ctx, W - 88, botY, 52); }

  return canvas.toBuffer('image/png');
}

module.exports = { generateQuoteCard };
