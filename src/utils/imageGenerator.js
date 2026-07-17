const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '../assets');
try {
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Bold.ttf'),    'InterBold');
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Medium.ttf'),  'InterMedium');
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Inter_24pt-Regular.ttf'), 'InterRegular');
} catch (err) {
  console.error('Font registration failed:', err.message);
}

const BG_DIR = path.join(__dirname, '../assets/backgrounds');
const TOTAL_BGS = 30;

function getBgPath(quoteId) {
  const index = ((quoteId - 1) % TOTAL_BGS) + 1;
  const p = path.join(BG_DIR, `bg${index}.png`);
  if (fs.existsSync(p)) return p;
  // fallback: any bg that exists
  for (let i = 1; i <= TOTAL_BGS; i++) {
    const fp = path.join(BG_DIR, `bg${i}.png`);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = cur + ' ' + words[i];
    if (ctx.measureText(test).width < maxWidth) cur = test;
    else { lines.push(cur); cur = words[i]; }
  }
  lines.push(cur);
  return lines;
}

function getFontSize(text) {
  if (text.length > 220) return 34;
  if (text.length > 160) return 40;
  if (text.length > 100) return 46;
  if (text.length > 60)  return 52;
  return 58;
}

// Draw dot grid pattern (top-right area)
function drawDotGrid(ctx, x, y, cols, rows, spacing, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.arc(x + c * spacing, y + r * spacing, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Draw gold frame border with corner ornaments
function drawGoldFrame(ctx, x, y, w, h) {
  const GOLD = '#C9A84C';
  const GOLD_LIGHT = '#E8C96A';

  // Outer border
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  // Inner border (inset by 10px)
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
  ctx.globalAlpha = 1;

  // Corner ornaments — small gold squares at each corner
  const corners = [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h]
  ];
  ctx.fillStyle = GOLD;
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx - 6, cy - 6, 12, 12);
  });

  ctx.restore();
}

async function generateQuoteCard(quoteObj) {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  const quoteId = quoteObj.id || 1;
  const text     = quoteObj.quote;
  const title    = (quoteObj.title || 'Daily Motivation').toUpperCase();

  // 1. Background image
  const bgPath = getBgPath(quoteId);
  if (bgPath) {
    try {
      const bgImg = await loadImage(bgPath);
      ctx.drawImage(bgImg, 0, 0, 1024, 1024);
    } catch (e) {
      console.error('BG load failed:', e.message);
      ctx.fillStyle = '#1a1209';
      ctx.fillRect(0, 0, 1024, 1024);
    }
  } else {
    ctx.fillStyle = '#1a1209';
    ctx.fillRect(0, 0, 1024, 1024);
  }

  // 2. Dark overlay for readability
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, 1024, 1024);

  // 3. Grain texture
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 16000; i++) {
    const gx = Math.random() * 1024;
    const gy = Math.random() * 1024;
    const gb = Math.random() * 255;
    ctx.fillStyle = `rgb(${gb},${gb},${gb})`;
    ctx.fillRect(gx, gy, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 4. Dot grid — top right
  drawDotGrid(ctx, 720, 60, 8, 6, 28, '#C9A84C', 0.35);

  // 5. Gold frame card
  const frameX = 80, frameY = 120, frameW = 864, frameH = 784;
  drawGoldFrame(ctx, frameX, frameY, frameW, frameH);

  // 6. Card inner dark fill
  ctx.fillStyle = 'rgba(8, 5, 2, 0.72)';
  ctx.fillRect(frameX + 3, frameY + 3, frameW - 6, frameH - 6);

  // 7. Opening quote mark " — top left inside frame
  ctx.save();
  ctx.font = '700 140px "InterBold"';
  ctx.fillStyle = '#C9A84C';
  ctx.globalAlpha = 0.9;
  ctx.textBaseline = 'top';
  ctx.fillText('\u201C', frameX + 30, frameY + 20);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Horizontal line after opening quote
  ctx.save();
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(frameX + 155, frameY + 72);
  ctx.lineTo(frameX + frameW - 30, frameY + 72);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // 8. Title text (motivating label) — below the line
  ctx.save();
  ctx.font = '500 22px "InterMedium"';
  ctx.fillStyle = '#C9A84C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';
  ctx.fillText(title, 512, frameY + 110);
  ctx.restore();

  // 9. Quote text — centered in card
  const fontSize = getFontSize(text);
  const textMaxW = frameW - 120;
  const cardCenterY = frameY + frameH / 2 + 30;

  ctx.save();
  ctx.font = `700 ${fontSize}px "InterBold"`;
  ctx.fillStyle = '#F5F0E8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 16;

  const lines = wrapText(ctx, text, textMaxW);
  const lh = fontSize * 1.55;
  const totalH = lines.length * lh;
  const startY = cardCenterY - totalH / 2 + lh / 2;
  lines.forEach((line, i) => ctx.fillText(line.trim(), 512, startY + i * lh));
  ctx.restore();

  // 10. Closing quote mark " — bottom center
  ctx.save();
  ctx.font = '700 100px "InterBold"';
  ctx.fillStyle = '#C9A84C';
  ctx.globalAlpha = 0.9;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('\u201D', 512, frameY + frameH - 90);
  ctx.globalAlpha = 1;
  ctx.restore();

  // 11. /// accent — bottom right inside frame
  ctx.save();
  ctx.font = '700 28px "InterBold"';
  ctx.fillStyle = '#C9A84C';
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('///', frameX + frameW - 25, frameY + frameH - 20);
  ctx.globalAlpha = 1;
  ctx.restore();

  // 12. Profile circle + handle — bottom left inside frame
  const circleX = frameX + 50;
  const circleY = frameY + frameH - 50;
  ctx.save();
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(circleX, circleY, 20, 0, Math.PI * 2);
  ctx.stroke();
  // T initial inside circle
  ctx.font = '700 20px "InterBold"';
  ctx.fillStyle = '#C9A84C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', circleX, circleY);
  // Handle text
  ctx.font = '400 16px "InterRegular"';
  ctx.fillStyle = 'rgba(245,240,232,0.75)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('@tonymotivation.bsky.social', circleX + 30, circleY);
  ctx.restore();

  // 13. LIKE | SHARE | FOLLOW footer — below frame
  ctx.save();
  ctx.font = '500 18px "InterMedium"';
  ctx.fillStyle = 'rgba(201,168,76,0.80)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText('LIKE  |  SHARE  |  FOLLOW', 512, frameY + frameH + 50);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = { generateQuoteCard };
