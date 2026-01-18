export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const hsvToRgb = (h: number, s: number, v: number) => {
   const normalizedHue = ((h % 360) + 360) % 360;
   const chroma = v * s;
   const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
   const m = v - chroma;

   let redPrime = 0;
   let greenPrime = 0;
   let bluePrime = 0;

   if (normalizedHue < 60) [redPrime, greenPrime, bluePrime] = [chroma, x, 0];
   else if (normalizedHue < 120) [redPrime, greenPrime, bluePrime] = [x, chroma, 0];
   else if (normalizedHue < 180) [redPrime, greenPrime, bluePrime] = [0, chroma, x];
   else if (normalizedHue < 240) [redPrime, greenPrime, bluePrime] = [0, x, chroma];
   else if (normalizedHue < 300) [redPrime, greenPrime, bluePrime] = [x, 0, chroma];
   else [redPrime, greenPrime, bluePrime] = [chroma, 0, x];

   const r = Math.round((redPrime + m) * 255);
   const g = Math.round((greenPrime + m) * 255);
   const b = Math.round((bluePrime + m) * 255);

   return { r, g, b };
};

export const rgbToHsv = (r: number, g: number, b: number) => {
   const rp = r / 255;
   const gp = g / 255;
   const bp = b / 255;

   const max = Math.max(rp, gp, bp);
   const min = Math.min(rp, gp, bp);
   const delta = max - min;

   let h = 0;
   if (delta !== 0) {
      if (max === rp) h = 60 * (((gp - bp) / delta) % 6);
      else if (max === gp) h = 60 * ((bp - rp) / delta + 2);
      else h = 60 * ((rp - gp) / delta + 4);
   }

   if (h < 0) h += 360;

   const s = max === 0 ? 0 : delta / max;
   const v = max;

   return { h, s, v };
};

export const normalizeHex = (hex: string) => {
   const normalized = hex.trim().replace(/^#/, '');
   if (normalized.length === 3) {
      // eslint-disable-next-line max-len
      return `#${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`.toLowerCase();
   }
   if (normalized.length === 6) return `#${normalized}`.toLowerCase();
   return '#000000';
};

export const rgbToHex = (r: number, g: number, b: number) => {
   const toHex = (n: number) => n.toString(16).padStart(2, '0');
   return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
};

export const normalizeHue = (h: unknown) => {
   const n = typeof h === 'number' ? h : Number(h);
   const v = Number.isFinite(n) ? n : 0;
   return ((v % 360) + 360) % 360;
};

export const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export const rgbToRgbaString = (r: number, g: number, b: number, a: number) => {
   const alpha = clamp01(a);
   return `rgba(${clampByte(r)}, ${clampByte(g)}, ${clampByte(b)}, ${alpha})`;
};

export const parseRgbaString = (value: string) => {
   const match = value
      .trim()
      .match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\s*\)$/i);

   if (!match) return null;

   return {
      r: clampByte(Number(match[1])),
      g: clampByte(Number(match[2])),
      b: clampByte(Number(match[3])),
      a: clamp01(Number(match[4])),
   };
};

export const rgbaToHue = (rgba: string) => {
   const parsed = parseRgbaString(rgba);
   if (!parsed) return 0;
   const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
   return hsv.h;
};

export const rgbaWithHue = (rgba: string, nextHue: number) => {
   const parsed = parseRgbaString(rgba);
   const base = parsed ?? { r: 0, g: 0, b: 0, a: 1 };

   const hsv = rgbToHsv(base.r, base.g, base.b);
   const rgb = hsvToRgb(nextHue, hsv.s, hsv.v);

   return rgbToRgbaString(rgb.r, rgb.g, rgb.b, base.a);
};

export const rgbToHue = (r: number, g: number, b: number): number => {
   const rf = r / 255;
   const gf = g / 255;
   const bf = b / 255;

   const max = Math.max(rf, gf, bf);
   const min = Math.min(rf, gf, bf);
   const d = max - min;

   if (d === 0) return 0;

   let h: number;
   if (max === rf) {
      h = (gf - bf) / d + (gf < bf ? 6 : 0);
   } else if (max === gf) {
      h = (bf - rf) / d + 2;
   } else {
      h = (rf - gf) / d + 4;
   }

   return (h * 60) % 360;
};

export const rgbaWithAlpha = (rgba: string, nextAlpha: number) => {
   const parsed = parseRgbaString(rgba);
   const base = parsed ?? { r: 0, g: 0, b: 0, a: 1 };
   return rgbToRgbaString(base.r, base.g, base.b, clamp01(nextAlpha));
};

export const alphaFromRgba = (rgba: string) => {
   const parsed = parseRgbaString(rgba);
   return parsed ? clamp01(parsed.a) : 1;
};

const THUMB_SIZE = 24;
const THUMB_RADIUS = THUMB_SIZE / 2;

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export const valueFromClientX = (clientX: number, rect: DOMRect) => {
   const cx = clamp(clientX - rect.left, THUMB_RADIUS, rect.width - THUMB_RADIUS);
   const t = (cx - THUMB_RADIUS) / Math.max(1, rect.width - 2 * THUMB_RADIUS);

   return clamp(t, 0, 1);
};

export const thumbLeftFromValue = (value01: number, width: number) => {
   return THUMB_RADIUS + clamp(value01, 0, 1) * Math.max(1, width - 2 * THUMB_RADIUS);
};

export type Rgb = { r: number; g: number; b: number };

export const hexToRgb = (hex: string): Rgb | null => {
   if (!hex) return null;

   let h = hex.trim();
   if (h.startsWith('#')) h = h.slice(1);

   if (h.length === 3 || h.length === 4) {
      h = h
         .split('')
         .map(ch => ch + ch)
         .join('');
   }

   if (h.length === 8) h = h.slice(0, 6);

   if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return null;

   const r = parseInt(h.slice(0, 2), 16);
   const g = parseInt(h.slice(2, 4), 16);
   const b = parseInt(h.slice(4, 6), 16);

   return { r, g, b };
};
