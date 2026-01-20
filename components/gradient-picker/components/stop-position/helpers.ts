import { clampN, stopGap } from '../gradient-slider/helpers';

export const enforceGapWithEdge = (
   pos: number,
   others: Array<{ position: number }>,
   gap: number,
) => {
   const clamped = clampN(pos, 0, 100);

   const hasAtRightEdge = others.some(s => Math.abs((s.position ?? 0) - 100) < 0.0001);
   if (hasAtRightEdge) {
      return Math.min(clamped, 100 - gap);
   }

   const hasAtLeftEdge = others.some(s => Math.abs((s.position ?? 0) - 0) < 0.0001);
   if (hasAtLeftEdge) {
      return Math.max(clamped, gap);
   }

   return stopGap(clamped, others, gap);
};
