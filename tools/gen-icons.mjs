/**
 * Generates the Titanium app icons.
 *
 * The mark is an original construction: a faceted octagon ("ingot") filled with
 * a diagonal violet gradient, carrying a negative-space T. Everything here is
 * drawn from geometry in this file - no third-party artwork is used or traced.
 *
 * Run: node tools/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// ---------------------------------------------------------------- PNG encoder

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Encodes an RGBA byte buffer as a PNG. */
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // 10..12 = compression, filter, interlace, all zero.

  // One filter byte (0 = None) per scanline.
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const src = y * width * 4;
    const dst = y * (width * 4 + 1);
    raw[dst] = 0;
    rgba.copy(raw, dst + 1, src, src + width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------- geometry

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const lerp = (a, b, t) => a + (b - a) * t;

/** Regular octagon, flat side up, inscribed in a circle of radius r. */
function octagonVertices(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 8) * (2 * i + 1);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Axis-aligned rectangle with rounded corners. */
function pointInRoundRect(x, y, left, top, right, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const nx = Math.max(left + radius - x, 0, x - (right - radius));
  const ny = Math.max(top + radius - y, 0, y - (bottom - radius));
  return nx * nx + ny * ny <= radius * radius;
}

/**
 * Renders the mark.
 *
 * @param size      output edge length in pixels
 * @param opts.background  canvas fill, or null for transparent
 * @param opts.scale       mark radius as a fraction of the canvas
 * @param opts.monochrome  render a flat white mark (Android monochrome icon)
 */
function renderMark(size, { background = null, scale = 0.38, monochrome = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * scale;
  const octagon = octagonVertices(cx, cy, r);

  const gradTop = hex('#C6BBFF');
  const gradBottom = hex('#7C63D8');
  const bg = background ? hex(background) : null;

  // The T is a union of a horizontal bar and a vertical stem, sized against r
  // so the mark scales cleanly to any canvas.
  const barLeft = cx - 0.54 * r;
  const barRight = cx + 0.54 * r;
  const barTop = cy - 0.48 * r;
  const barBottom = cy - 0.17 * r;
  const stemLeft = cx - 0.155 * r;
  const stemRight = cx + 0.155 * r;
  const stemBottom = cy + 0.54 * r;
  const corner = 0.05 * r;

  const inT = (x, y) =>
    pointInRoundRect(x, y, barLeft, barTop, barRight, barBottom, corner) ||
    pointInRoundRect(x, y, stemLeft, barTop, stemRight, stemBottom, corner);

  const SS = 4; // 4x4 supersampling gives clean facet edges
  const step = 1 / SS;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let markHits = 0;
      let cutHits = 0;
      let gradAcc = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) * step;
          const y = py + (sy + 0.5) * step;
          if (!pointInPolygon(x, y, octagon)) continue;
          if (inT(x, y)) {
            cutHits++;
            continue;
          }
          markHits++;
          // Diagonal gradient: top-left light, bottom-right deep.
          gradAcc += Math.min(1, Math.max(0, (x - (cx - r) + (y - (cy - r))) / (4 * r)));
        }
      }

      const samples = SS * SS;
      const markCoverage = markHits / samples;
      const cutCoverage = cutHits / samples;
      const idx = (py * size + px) * 4;

      // Start from the canvas.
      let [rr, gg, bb] = bg ?? [0, 0, 0];
      let aa = bg ? 1 : 0;

      // The cut-out shows the canvas through the mark, so on a transparent
      // canvas it stays transparent - which is exactly what the splash and
      // adaptive-icon foreground need.
      if (markCoverage > 0) {
        const t = gradAcc / Math.max(markHits, 1);
        const mr = monochrome ? 255 : lerp(gradTop[0], gradBottom[0], t);
        const mg = monochrome ? 255 : lerp(gradTop[1], gradBottom[1], t);
        const mb = monochrome ? 255 : lerp(gradTop[2], gradBottom[2], t);
        const outA = aa + markCoverage * (1 - aa);
        rr = (mr * markCoverage + rr * aa * (1 - markCoverage)) / (outA || 1);
        gg = (mg * markCoverage + gg * aa * (1 - markCoverage)) / (outA || 1);
        bb = (mb * markCoverage + bb * aa * (1 - markCoverage)) / (outA || 1);
        aa = outA;
      }
      void cutCoverage;

      rgba[idx] = Math.round(Math.min(255, Math.max(0, rr)));
      rgba[idx + 1] = Math.round(Math.min(255, Math.max(0, gg)));
      rgba[idx + 2] = Math.round(Math.min(255, Math.max(0, bb)));
      rgba[idx + 3] = Math.round(Math.min(255, Math.max(0, aa * 255)));
    }
  }

  return encodePng(size, size, rgba);
}

// --------------------------------------------------------------------- output

const out = (name, buf) => {
  writeFileSync(new URL(`../assets/${name}`, import.meta.url), buf);
  console.log(`  assets/${name}  ${(buf.length / 1024).toFixed(1)} KB`);
};

console.log('Rendering Titanium icons...');
// iOS icons must be opaque; the system applies its own corner mask.
out('icon.png', renderMark(1024, { background: '#131313', scale: 0.36 }));
// Splash and adaptive foreground sit on the themed background colour.
out('splash-icon.png', renderMark(512, { background: null, scale: 0.42 }));
// Android adaptive foregrounds need the mark inside the ~66% safe zone.
out('android-icon-foreground.png', renderMark(1024, { background: null, scale: 0.26 }));
out('android-icon-monochrome.png', renderMark(1024, { background: null, scale: 0.26, monochrome: true }));
out('favicon.png', renderMark(64, { background: '#131313', scale: 0.36 }));
console.log('Done.');
