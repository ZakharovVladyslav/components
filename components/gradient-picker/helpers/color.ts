export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const hsvToRgb = (h: number, s: number, v: number) => {
   const hh = ((h % 360) + 360) % 360;
   const c = v * s;
   const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
   const m = v - c;

   let rp = 0,
      gp = 0,
      bp = 0;

   if (hh < 60) [rp, gp, bp] = [c, x, 0];
   else if (hh < 120) [rp, gp, bp] = [x, c, 0];
   else if (hh < 180) [rp, gp, bp] = [0, c, x];
   else if (hh < 240) [rp, gp, bp] = [0, x, c];
   else if (hh < 300) [rp, gp, bp] = [x, 0, c];
   else [rp, gp, bp] = [c, 0, x];

   const r = Math.round((rp + m) * 255);
   const g = Math.round((gp + m) * 255);
   const b = Math.round((bp + m) * 255);

   return { r, g, b };
};

export const rgbToHsv = (r: number, g: number, b: number) => {
   const rp = r / 255;
   const gp = g / 255;
   const bp = b / 255;

   const max = Math.max(rp, gp, bp);
   const min = Math.min(rp, gp, bp);
   const d = max - min;

   let h = 0;
   if (d !== 0) {
      if (max === rp) h = 60 * (((gp - bp) / d) % 6);
      else if (max === gp) h = 60 * ((bp - rp) / d + 2);
      else h = 60 * ((rp - gp) / d + 4);
   }
   if (h < 0) h += 360;

   const s = max === 0 ? 0 : d / max;
   const v = max;

   return { h, s, v };
};

export const normalizeHex = (hex: string) => {
   const h = hex.trim().replace(/^#/, '');
   if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
   if (h.length === 6) return `#${h}`.toLowerCase();
   return '#000000';
};

export const hexToRgb = (hex: string) => {
   const h = normalizeHex(hex).slice(1);
   const r = parseInt(h.slice(0, 2), 16);
   const g = parseInt(h.slice(2, 4), 16);
   const b = parseInt(h.slice(4, 6), 16);
   return { r, g, b };
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

export const hexWithHue = (hex: string, nextHue: number) => {
   const { r, g, b } = hexToRgb(hex);
   const { s, v } = rgbToHsv(r, g, b);
   const rgb = hsvToRgb(nextHue, s, v);
   return rgbToHex(rgb.r, rgb.g, rgb.b);
};

export const hexToHue = (hex: string) => {
   const { r, g, b } = hexToRgb(hex);
   const { h } = rgbToHsv(r, g, b);
   return h;
};

const THUMB_SIZE = 24; // tailwind size-6 => 24px
const R = THUMB_SIZE / 2;

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export const valueFromClientX = (clientX: number, rect: DOMRect) => {
   const cx = clamp(clientX - rect.left, R, rect.width - R);
   const t = (cx - R) / Math.max(1, rect.width - 2 * R);

   return clamp(t, 0, 1);
};

export const thumbLeftFromValue = (value01: number, width: number) => {
   return R + clamp(value01, 0, 1) * Math.max(1, width - 2 * R);
};
