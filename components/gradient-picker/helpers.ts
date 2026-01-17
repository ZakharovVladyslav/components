/* eslint-disable max-len */
import { normalizeHex, rgbToHex } from './helpers/color';
import { Stops } from './types';

export const parseAngle = (input: string) => {
   const m = input.match(/linear-gradient\(\s*([-\d.]+)deg\s*,/i);
   if (!m) return 90;
   const n = Number(m[1]);
   return Number.isFinite(n) ? n : 90;
};

export const parseStopsFromLinearGradient = (
   input: string,
): Nullable<{
   angle: number;
   stops: Array<{ position: number; color: string; alpha: number }>;
}> => {
   if (!input || !/linear-gradient\(/i.test(input)) return null;

   const angle = parseAngle(input);

   // Match segments like: rgba(255, 0, 0, 0.5) 15%
   const rgbaStopRe =
      /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\s*\)\s*([0-9]*\.?[0-9]+)%/gi;

   const parsed: Array<{ position: number; color: string; alpha: number }> = [];
   let match: RegExpExecArray | null;

   while ((match = rgbaStopRe.exec(input)) !== null) {
      const r = clamp(Number(match[1]), 0, 255);
      const g = clamp(Number(match[2]), 0, 255);
      const b = clamp(Number(match[3]), 0, 255);
      const a = clamp(Number(match[4]), 0, 1);
      const p = clamp(Number(match[5]), 0, 100);

      parsed.push({
         position: p,
         color: rgbToHex(r, g, b),
         alpha: a,
      });
   }

   if (parsed.length === 0) return null;

   parsed.sort((a, b) => a.position - b.position);
   return { angle, stops: parsed };
};

export const stopsArrayToRecord = (
   arr: Array<{ position: number; color: string; alpha: number }>,
): Stops => {
   const rec: Stops = {};
   arr.forEach((st, idx) => {
      const id = `stop${idx + 1}`;
      rec[id] = { id, position: st.position, color: st.color, alpha: st.alpha };
   });
   return rec;
};

type ParsedStop = { color: string; alpha: number; position: number };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const toStopsRecord = (arr: ParsedStop[]): Stops => {
   const rec: Stops = {};
   arr.forEach((st, idx) => {
      const id = `stop${idx + 1}`;
      rec[id] = { id, position: st.position, color: st.color, alpha: st.alpha };
   });
   return rec;
};

const splitTopLevelComma = (s: string) => {
   const out: string[] = [];
   let cur = '';
   let depth = 0;
   for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
         out.push(cur.trim());
         cur = '';
      } else {
         cur += ch;
      }
   }
   if (cur.trim()) out.push(cur.trim());
   return out;
};

const parseHexStop = (token: string): { color: string; position?: number } | null => {
   // "#fff 20%" OR "#ffffff" etc
   const m = token.trim().match(/^(#[0-9a-fA-F]{3,8})\s*(?:([0-9]*\.?[0-9]+)%\s*)?$/);
   if (!m) return null;
   const color = normalizeHex(m[1]);
   const pos = m[2] != null ? clamp(Number(m[2]), 0, 100) : undefined;
   return { color, position: pos };
};

const parseRgbaStop = (
   token: string,
): { color: string; alpha: number; position?: number } | null => {
   // rgba(r,g,b,a) 20%
   const m = token
      .trim()
      .match(
         /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\s*\)\s*(?:([0-9]*\.?[0-9]+)%\s*)?$/i,
      );
   if (!m) return null;

   const r = clamp(Number(m[1]), 0, 255);
   const g = clamp(Number(m[2]), 0, 255);
   const b = clamp(Number(m[3]), 0, 255);
   const a = clamp(Number(m[4]), 0, 1);
   const pos = m[5] != null ? clamp(Number(m[5]), 0, 100) : undefined;

   return { color: rgbToHex(r, g, b), alpha: a, position: pos };
};

export const parseLinearGradientToStops = (gradient: string): Stops | null => {
   if (!gradient) return null;
   const m = gradient.match(/linear-gradient\((.*)\)/i);
   if (!m) return null;

   const inside = m[1].trim();
   const parts = splitTopLevelComma(inside);

   // optional first part: "90deg" / "to right" etc. We'll just ignore it for stop parsing.
   // Everything after the first part that contains a color is treated as a stop token.
   const stopTokens = parts.filter(p => /#|rgba\(/i.test(p));

   if (stopTokens.length === 0) return null;

   const parsed: ParsedStop[] = [];
   for (const tok of stopTokens) {
      const rgba = parseRgbaStop(tok);
      if (rgba) {
         parsed.push({
            color: rgba.color,
            alpha: rgba.alpha,
            position: rgba.position ?? NaN,
         });
         continue;
      }
      const hex = parseHexStop(tok);
      if (hex) {
         parsed.push({
            color: hex.color,
            alpha: 1,
            position: hex.position ?? NaN,
         });
         continue;
      }
   }

   if (parsed.length === 0) return null;

   // If positions are missing, spread them evenly
   const anyHasPos = parsed.some(s => Number.isFinite(s.position));
   if (!anyHasPos) {
      const n = parsed.length;
      parsed.forEach((s, i) => {
         s.position = n === 1 ? 50 : (i / (n - 1)) * 100;
      });
   } else {
      // Fill missing positions by simple fallback:
      // - if first missing: 0
      // - if last missing: 100
      // - middle missing: keep its index-based spread (good enough)
      const n = parsed.length;
      parsed.forEach((s, i) => {
         if (!Number.isFinite(s.position)) {
            if (i === 0) s.position = 0;
            else if (i === n - 1) s.position = 100;
            else s.position = (i / (n - 1)) * 100;
         }
      });
   }

   // clamp + sort
   parsed.forEach(s => (s.position = clamp(s.position, 0, 100)));
   parsed.sort((a, b) => a.position - b.position);

   return toStopsRecord(parsed);
};
