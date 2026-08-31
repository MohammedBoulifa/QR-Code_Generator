const input = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const downloadRow = document.getElementById('download-row');
const downloadBtn = document.getElementById('download-btn');
const formatSelect = document.getElementById('format-select');
const qrDiv = document.getElementById('qrcode');

const sizeSlider = document.getElementById('size-slider');
const sizeNumber = document.getElementById('size-number');
const SIZE_MIN = parseInt(sizeSlider.min, 10);
const SIZE_MAX = parseInt(sizeSlider.max, 10);

const darkPicker = document.getElementById('dark-picker');
const darkHex = document.getElementById('dark-hex');
const lightPicker = document.getElementById('light-picker');
const lightHex = document.getElementById('light-hex');

const metaEncoded = document.getElementById('meta-encoded');
const metaSize = document.getElementById('meta-size');
const metaColor = document.getElementById('meta-color');
const metaStatus = document.getElementById('meta-status');

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const PREVIEW_MAX = 260; // largest a code is shown at, regardless of actual export size
const PREVIEW_MIN = 120; // keeps the card from looking empty at tiny sizes

let qrInstance = null; // holds the current QRCode.js instance so we can reach its module grid

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value) {
  const v = value.trim();
  return HEX_RE.test(v) ? v : null;
}

// ---------- size: slider <-> manual entry, both clamped to 50–600 ----------

function setSize(value) {
  const clamped = clamp(value, SIZE_MIN, SIZE_MAX);
  sizeSlider.value = clamped;
  sizeNumber.value = clamped;
  return clamped;
}

sizeSlider.addEventListener('input', () => {
  sizeNumber.value = sizeSlider.value;
});

// while typing, let the field hold whatever — only clamp once they commit
sizeNumber.addEventListener('change', () => {
  const parsed = parseInt(sizeNumber.value, 10);
  setSize(Number.isNaN(parsed) ? parseInt(sizeSlider.value, 10) : parsed);
});

sizeNumber.addEventListener('blur', () => {
  const parsed = parseInt(sizeNumber.value, 10);
  setSize(Number.isNaN(parsed) ? parseInt(sizeSlider.value, 10) : parsed);
});

// ---------- color: wheel <-> hex text, kept in sync ----------

function linkColorInputs(picker, hexField) {
  picker.addEventListener('input', () => {
    hexField.value = picker.value;
  });
  hexField.addEventListener('input', () => {
    const clean = normalizeHex(hexField.value);
    if (clean) picker.value = clean;
  });
}

linkColorInputs(darkPicker, darkHex);
linkColorInputs(lightPicker, lightHex);

// ---------- generate ----------

function generate() {
  const value = input.value.trim();
  if (!value) {
    input.focus();
    return;
  }

  const size = setSize(parseInt(sizeNumber.value, 10));
  const dark = normalizeHex(darkHex.value) || '#17182b';
  const light = normalizeHex(lightHex.value) || '#ffffff';

  qrDiv.innerHTML = '';
  qrInstance = new QRCode(qrDiv, {
    text: value,
    width: size,
    height: size,
    colorDark: dark,
    colorLight: light,
    correctLevel: QRCode.CorrectLevel.M
  });

  // the actual bitmap stays at full resolution for export; only the on-screen
  // display is scaled so a 600px code doesn't blow out the card. QRCode.js
  // renders either a <canvas> or an <img> fallback depending on the browser,
  // and sometimes leaves both in the DOM — size whichever is actually there
  // so the visible one is never left at native resolution and clipped.
  const displaySize = clamp(size, PREVIEW_MIN, PREVIEW_MAX);
  qrDiv.querySelectorAll('canvas, img').forEach((el) => {
    el.style.width = displaySize + 'px';
    el.style.height = 'auto';
  });

  metaEncoded.textContent = truncate(value, 24);
  metaSize.textContent = `${size} × ${size} px`;
  metaColor.textContent = `${dark} / ${light}`;
  metaStatus.textContent = 'ready';
  downloadRow.style.display = 'flex';
}

// ---------- export helpers ----------

function getPngDataUrl() {
  const canvas = qrDiv.querySelector('canvas');
  if (canvas) return canvas.toDataURL('image/png');
  const img = qrDiv.querySelector('img');
  return img ? img.src : null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// builds a true vector SVG straight from the QR module grid — not a
// raster image wrapped in an <svg> tag
function buildSvg(qrModel, size, dark, light) {
  const count = qrModel.getModuleCount();
  const cell = size / count;
  let rects = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qrModel.isDark(row, col)) {
        const x = (col * cell).toFixed(2);
        const y = (row * cell).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="100%" height="100%" fill="${light}"/>` +
    `<g fill="${dark}">${rects}</g></svg>`;
}

async function download() {
  if (!qrInstance) return;

  const format = formatSelect.value;
  const size = parseInt(sizeNumber.value, 10);
  const dark = normalizeHex(darkHex.value) || '#17182b';
  const light = normalizeHex(lightHex.value) || '#ffffff';

  if (format === 'svg') {
    const svgStr = buildSvg(qrInstance._oQRCode, size, dark, light);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, 'qrcode.svg');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const pngDataUrl = getPngDataUrl();
  if (!pngDataUrl) return;

  if (format === 'png') {
    triggerDownload(pngDataUrl, 'qrcode.png');
    return;
  }

  if (format === 'jpg') {
    // re-draw onto a plain canvas so we can re-encode as jpeg
    const img = await loadImage(pngDataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    triggerDownload(canvas.toDataURL('image/jpeg', 0.92), 'qrcode.jpg');
    return;
  }

  if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'px', format: [size, size] });
    pdf.addImage(pngDataUrl, 'PNG', 0, 0, size, size);
    pdf.save('qrcode.pdf');
  }
}

generateBtn.addEventListener('click', generate);
downloadBtn.addEventListener('click', download);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generate();
});
