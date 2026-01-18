import { CSSProperties, RefObject } from 'react';

import { MIN_GAP } from './const';
import { hexToRgb } from '../../helpers/color';
import { clamp } from '../../helpers/number';
import { Stop, Stops } from '../../types';

export const STOP_SIZE = 24;
export const R = STOP_SIZE / 2;

export const makeId = () =>
   `stop_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;

export const clampN = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export const stopGap = (pos: number, all: Array<{ position: number }>, minGap = 4) => {
   const sorted = all.slice().sort((a, b) => a.position - b.position);
   let p = pos;

   for (let i = 0; i < sorted.length; i++) {
      if (Math.abs(sorted[i].position - p) < minGap) {
         p = clampN(sorted[i].position + minGap, 0, 100);
      }
   }
   return p;
};

export const leftPxFromPercent = (posPct: number, width: number) => {
   const t = clampN(posPct, 0, 100) / 100;
   return R + t * Math.max(1, width - 2 * R);
};

export const calcPosition = (
   clientX: number,
   ref: RefObject<Nullable<HTMLDivElement>>,
) => {
   if (!ref.current) return 0;

   const rect = ref.current.getBoundingClientRect();
   let pos = ((clientX - rect.left) / rect.width) * 100;
   pos = Math.max(0, Math.min(100, pos));
   return pos;
};

type BlockState = Nullable<{ neighborId: string; dir: -1 | 1 }>;

const getNeighborsForPos = (pos: number, activeStopId: string, stops: Stops) => {
   const others = Object.values(stops)
      .filter(s => s.id !== activeStopId)
      .slice()
      .sort((a, b) => a.position - b.position);

   let left: Nullable<Stop> = null;
   let right: Nullable<Stop> = null;

   for (let i = 0; i < others.length; i++) {
      if (others[i].position < pos) left = others[i];
      if (others[i].position > pos) {
         right = others[i];
         break;
      }
   }

   return { left, right };
};

const clampBetween = (pos: number, left: Nullable<Stop>, right: Nullable<Stop>) => {
   let p = pos;
   if (left) p = Math.max(p, left.position + MIN_GAP);
   if (right) p = Math.min(p, right.position - MIN_GAP);
   return Math.max(0, Math.min(100, p));
};

export const applyJump = (
   rawPos: number,
   activeStopId: string,
   stops: Stops,
   lastRawPos: Nullable<number>,
   block: BlockState,
) => {
   let pos = Math.max(0, Math.min(100, rawPos));
   const dir = lastRawPos == null ? 0 : rawPos - lastRawPos;

   const { left, right } = getNeighborsForPos(pos, activeStopId, stops);

   if (block) {
      const n = stops[block.neighborId] ?? null;

      if (!n) {
         block = null;
      } else if (block.dir === 1) {
         if (rawPos <= n.position - MIN_GAP) {
            block = null;
         } else if (rawPos < n.position + MIN_GAP) {
            pos = n.position - MIN_GAP;
            const nn = getNeighborsForPos(pos, activeStopId, stops);
            pos = clampBetween(pos, nn.left, nn.right);
            return { pos, block };
         } else {
            block = null;
         }
      } else {
         if (rawPos >= n.position + MIN_GAP) {
            block = null;
         } else if (rawPos > n.position - MIN_GAP) {
            pos = n.position + MIN_GAP;
            const nn = getNeighborsForPos(pos, activeStopId, stops);
            pos = clampBetween(pos, nn.left, nn.right);
            return { pos, block };
         } else {
            block = null;
         }
      }
   }

   if (dir > 0 && right) {
      if (rawPos >= right.position - MIN_GAP && rawPos < right.position + MIN_GAP) {
         block = { neighborId: right.id, dir: 1 };
         pos = right.position - MIN_GAP;
         const nn = getNeighborsForPos(pos, activeStopId, stops);
         pos = clampBetween(pos, nn.left, nn.right);
         return { pos, block };
      }
   }

   if (dir < 0 && left) {
      if (rawPos <= left.position + MIN_GAP && rawPos > left.position - MIN_GAP) {
         block = { neighborId: left.id, dir: -1 };
         pos = left.position + MIN_GAP;
         const nn = getNeighborsForPos(pos, activeStopId, stops);
         pos = clampBetween(pos, nn.left, nn.right);
         return { pos, block };
      }
   }

   pos = clampBetween(pos, left, right);
   return { pos, block };
};

export const buildLinearGradient = (
   stops: Array<{ position: number; color: string; alpha?: number }>,
   angle = 90,
) => {
   const parts = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(s => {
         const { r, g, b } = hexToRgb(s.color);
         const a = clamp(typeof s.alpha === 'number' ? s.alpha : 1, 0, 1);
         const p = clamp(s.position, 0, 100);
         return `rgba(${r}, ${g}, ${b}, ${a}) ${p}%`;
      });

   return `linear-gradient(${angle}deg, ${parts.join(', ')})`;
};

export const getStopStyle = (stop: Stop & { leftPx?: number }): CSSProperties => ({
   left: stop.leftPx != null ? `${stop.leftPx}px` : `${stop.position}%`,
});

export const getStopInnerStyle = (stop: Stop): CSSProperties => ({
   opacity: stop.alpha,
   backgroundColor: stop.color,
});

export const sameIds = (a: string[] = [], b: string[] = []) => {
   if (a === b) return true;
   if (a.length !== b.length) return false;
   for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
   return true;
};

export const orderIdsByPosition = (stopsMap: Stops | null | undefined) => {
   const map = stopsMap ?? {};
   return Object.values(map)
      .slice()
      .sort((x, y) => x.position - y.position)
      .map(st => st.id);
};
