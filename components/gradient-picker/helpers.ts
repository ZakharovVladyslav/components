/* eslint-disable max-len */
import { GradientFormats } from './components';
import { normalizeHex, rgbToRgbaString } from './helpers/color';
import { Stops } from './types';

type ParsedStop = { color: string; position: number };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const splitTopLevelComma = (value: string) => {
   const output: string[] = [];
   let current = '';
   let depth = 0;

   for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);

      if (ch === ',' && depth === 0) {
         output.push(current.trim());
         current = '';
      } else {
         current += ch;
      }
   }

   if (current.trim()) output.push(current.trim());
   return output;
};

const parseHexStop = (token: string): { color: string; position?: number } | null => {
   const match = token.trim().match(/^(#[0-9a-fA-F]{3,8})\s*(?:([0-9]*\.?[0-9]+)%\s*)?$/);
   if (!match) return null;

   const hex = normalizeHex(match[1]);
   const red = parseInt(hex.slice(1, 3), 16);
   const green = parseInt(hex.slice(3, 5), 16);
   const blue = parseInt(hex.slice(5, 7), 16);

   const color = rgbToRgbaString(red, green, blue, 1);
   const position = match[2] != null ? clamp(Number(match[2]), 0, 100) : undefined;

   return { color, position };
};

const parseRgbaStop = (token: string): { color: string; position?: number } | null => {
   const match = token
      .trim()
      .match(
         /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\s*\)\s*(?:([0-9]*\.?[0-9]+)%\s*)?$/i,
      );
   if (!match) return null;

   const red = clamp(Number(match[1]), 0, 255);
   const green = clamp(Number(match[2]), 0, 255);
   const blue = clamp(Number(match[3]), 0, 255);
   const alpha = clamp(Number(match[4]), 0, 1);
   const position = match[5] != null ? clamp(Number(match[5]), 0, 100) : undefined;

   return { color: rgbToRgbaString(red, green, blue, alpha), position };
};

const toStopsRecord = (arr: ParsedStop[]): Stops => {
   const record: Stops = {};
   arr.forEach((stop, index) => {
      const id = `stop${index + 1}`;
      record[id] = { id, position: stop.position, color: stop.color };
   });
   return record;
};

export type ParsedGradient = {
   format: GradientFormats;
   prefix: string;
   stops: Stops;
};

const detectFormat = (gradient: string): GradientFormats | null => {
   if (/^\s*linear-gradient\(/i.test(gradient)) return 'linear-gradient';
   if (/^\s*radial-gradient\(/i.test(gradient)) return 'radial-gradient';
   if (/^\s*conic-gradient\(/i.test(gradient)) return 'conic-gradient';
   return null;
};

export const parseGradientToStops = (gradient: string): ParsedGradient | null => {
   if (!gradient) return null;

   const format = detectFormat(gradient);
   if (!format) return null;

   const match = gradient.match(/^[a-z-]+-gradient\((.*)\)\s*$/i);
   if (!match) return null;

   const inside = match[1].trim();
   const parts = splitTopLevelComma(inside);

   const isStopToken = (p: string) => /#|rgba\(/i.test(p);
   const firstStopIndex = parts.findIndex(isStopToken);
   if (firstStopIndex === -1) return null;

   const prefix = parts.slice(0, firstStopIndex).join(', ').trim();
   const stopTokens = parts.slice(firstStopIndex);

   const parsed: ParsedStop[] = [];

   for (const token of stopTokens) {
      const rgbaStop = parseRgbaStop(token);
      if (rgbaStop) {
         parsed.push({ color: rgbaStop.color, position: rgbaStop.position ?? NaN });
         continue;
      }

      const hexStop = parseHexStop(token);
      if (hexStop)
         parsed.push({ color: hexStop.color, position: hexStop.position ?? NaN });
   }

   if (parsed.length === 0) return null;

   const anyHasPosition = parsed.some(s => Number.isFinite(s.position));
   const count = parsed.length;

   if (!anyHasPosition) {
      parsed.forEach((s, i) => (s.position = count === 1 ? 50 : (i / (count - 1)) * 100));
   } else {
      parsed.forEach((s, i) => {
         if (Number.isFinite(s.position)) return;
         if (i === 0) s.position = 0;
         else if (i === count - 1) s.position = 100;
         else s.position = (i / (count - 1)) * 100;
      });
   }

   parsed.forEach(s => (s.position = clamp(s.position, 0, 100)));
   parsed.sort((a, b) => a.position - b.position);

   return { format, prefix, stops: toStopsRecord(parsed) };
};

export const buildGradient = (
   stops: Array<{ position: number; color: string }>,
   opts: { format: GradientFormats; angle?: number; prefix?: string },
) => {
   const parts = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${clamp(s.position, 0, 100)}%`)
      .join(', ');

   if (opts.format === 'linear-gradient') {
      const angle = Number.isFinite(opts.angle) ? opts.angle! : 90;
      return `linear-gradient(${angle}deg, ${parts})`;
   }

   if (opts.format === 'radial-gradient') {
      const prefix = (opts.prefix ?? '').trim();
      return prefix
         ? `radial-gradient(${prefix}, ${parts})`
         : `radial-gradient(${parts})`;
   }

   const prefix = (opts.prefix ?? '').trim();
   return prefix ? `conic-gradient(${prefix}, ${parts})` : `conic-gradient(${parts})`;
};
