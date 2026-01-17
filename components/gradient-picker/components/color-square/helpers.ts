export const toFiniteNumber = (v: unknown, fallback: number) => {
   const n = typeof v === 'number' ? v : Number(v);
   return Number.isFinite(n) ? n : fallback;
};

export const normalizeHue = (h: unknown) => {
   const n = toFiniteNumber(h, 0);
   return ((n % 360) + 360) % 360;
};
