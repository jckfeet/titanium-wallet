/**
 * Generates the Titanium app icons.
 *
 * The mark is a flat disc carrying a negative-space P - stem, bowl and a
 * counter punched back out - matching src/components/Logo.tsx exactly, so the
 * home-screen icon and the in-app mark are the same shape. Built from the
 * parameters below rather than traced from any existing artwork.
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

/**
 * Coverage test for the mark at one point.
 *
 * Mirrors the geometry in src/components/Logo.tsx: a disc of radius r, with a
 * P cut out of it. Returns 0 outside the disc, 1 on the disc body, and -1 on
 * the cut-out glyph, so the caller can paint three ways from one test.
 */
function markAt(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  if (dx * dx + dy * dy > r * r) return 0;

  const stemW = 0.17 * r;
  const stemX = cx - 0.30 * r;
  const top = cy - 0.52 * r;
  const stemH = 1.04 * r;
  const bowlOuter = 0.37 * r;
  const bowlInner = 0.20 * r;
  const bowlCx = stemX + stemW;
  const bowlCy = top + bowlOuter;

  if (x >= stemX && x <= stemX + stemW && y >= top && y <= top + stemH) return -1;

  // The bowl is clipped to the stem's left edge. Without this the ring wraps
  // around both sides of the stem and the glyph reads as a phi, not a P.
  if (x >= stemX) {
    const bx = x - bowlCx;
    const by = y - bowlCy;
    const bd2 = bx * bx + by * by;
    if (bd2 <= bowlOuter * bowlOuter && bd2 > bowlInner * bowlInner) return -1;
  }

  return 1;
}

/**
 * Renders the mark.
 *
 * @param size            output edge length in pixels
 * @param opts.background canvas fill, or null for transparent
 * @param opts.disc       disc fill; a two-stop vertical gradient
 * @param opts.cutout     colour showing through the negative-space P
 * @param opts.scale      disc radius as a fraction of the canvas
 */
function renderMark(
  size,
  { background = null, disc = ['#FFFFFF', '#EDE7FF'], cutout = '#000000', scale = 0.38 } = {},
) {
  const rgba = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * scale;

  const bg = background ? hex(background) : null;
  const top = hex(disc[0]);
  const bottom = hex(disc[1]);
  const cut = hex(cutout);

  const SS = 4; // 4x4 supersampling keeps the disc edge and the counter clean
  const step = 1 / SS;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let body = 0;
      let glyph = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const v = markAt(px + (sx + 0.5) * step, py + (sy + 0.5) * step, cx, cy, r);
          if (v === 1) body++;
          else if (v === -1) glyph++;
        }
      }

      const total = SS * SS;
      const bodyCov = body / total;
      const glyphCov = glyph / total;
      const idx = (py * size + px) * 4;

      let [rr, gg, bb] = bg ?? [0, 0, 0];
      let aa = bg ? 1 : 0;

      // Disc body first, shaded top-to-bottom, then the glyph over it.
      if (bodyCov > 0) {
        const t = Math.min(1, Math.max(0, (py - (cy - r)) / (2 * r)));
        const sr = lerp(top[0], bottom[0], t);
        const sg = lerp(top[1], bottom[1], t);
        const sb = lerp(top[2], bottom[2], t);
        const outA = aa + bodyCov * (1 - aa);
        rr = (sr * bodyCov + rr * aa * (1 - bodyCov)) / (outA || 1);
        gg = (sg * bodyCov + gg * aa * (1 - bodyCov)) / (outA || 1);
        bb = (sb * bodyCov + bb * aa * (1 - bodyCov)) / (outA || 1);
        aa = outA;
      }

      if (glyphCov > 0) {
        const outA = aa + glyphCov * (1 - aa);
        rr = (cut[0] * glyphCov + rr * aa * (1 - glyphCov)) / (outA || 1);
        gg = (cut[1] * glyphCov + gg * aa * (1 - glyphCov)) / (outA || 1);
        bb = (cut[2] * glyphCov + bb * aa * (1 - glyphCov)) / (outA || 1);
        aa = outA;
      }

      rgba[idx] = Math.round(Math.min(255, Math.max(0, rr)));
      rgba[idx + 1] = Math.round(Math.min(255, Math.max(0, gg)));
      rgba[idx + 2] = Math.round(Math.min(255, Math.max(0, bb)));
      rgba[idx + 3] = Math.round(Math.min(255, Math.max(0, aa * 255)));
    }
  }

  return encodePng(size, size, rgba);
}

// --------------------------------------------------------------------- output

const LAVENDER = '#AB9FF2';
const BLACK = '#000000';

const out = (name, buf) => {
  writeFileSync(new URL(`../assets/${name}`, import.meta.url), buf);
  console.log(`  assets/${name}  ${(buf.length / 1024).toFixed(1)} KB`);
};

console.log('Rendering Photon icons...');
// iOS icons must be opaque; the system applies its own squircle mask.
out('icon.png', renderMark(1024, { background: BLACK, disc: [LAVENDER, '#8E7BF0'], cutout: BLACK, scale: 0.34 }));
// Splash and adaptive foreground sit on the black app background, so the disc
// carries the accent colour instead of the plate.
out('splash-icon.png', renderMark(512, { background: null, disc: [LAVENDER, '#8E7BF0'], cutout: BLACK, scale: 0.42 }));
out('android-icon-foreground.png', renderMark(1024, { background: null, disc: [LAVENDER, '#8E7BF0'], cutout: BLACK, scale: 0.26 }));
out('android-icon-monochrome.png', renderMark(1024, { background: null, disc: ['#FFFFFF', '#FFFFFF'], cutout: BLACK, scale: 0.26 }));
out('favicon.png', renderMark(64, { background: BLACK, disc: [LAVENDER, '#8E7BF0'], cutout: BLACK, scale: 0.34 }));
console.log('Done.');
