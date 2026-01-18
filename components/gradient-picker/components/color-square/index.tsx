'use client';

import React, {
   PointerEvent,
   useContext,
   useEffect,
   useMemo,
   useRef,
   useState,
} from 'react';

import s from './color-square.module.css';
import { normalizeHue } from './helpers';
import { ColorContext, GradientContext } from '../../context';
import { clamp01, hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '../../helpers/color';
import { cn } from '../../helpers/string';

/**
 * Class names for customizing the Color Square component.
 * @property {string} square - Class name for the color square wrapper.
 * @property {string} pointer - Class name for the color square pointer.
 */
export type ColorSquareClassNames = {
   square: string;
   pointer: string;
};

type TProps = {
   classNames?: Partial<ColorSquareClassNames>;
   onChange?: (hex: string) => void;
};

export const ColorSquare = ({ classNames, onChange }: TProps) => {
   const { hex, hue, onHexChange } = useContext(ColorContext);

   const { activeStopId, stops } = useContext(GradientContext);

   const [saturationValue, setSaturationValue] = useState<{
      saturation: number;
      value: number;
   }>(() => ({
      saturation: 1,
      value: 1,
   }));
   const [dimensions, setDimensions] = useState<{ w: number; h: number }>({
      w: 0,
      h: 0,
   });
   const [redrawTick, setRedrawTick] = useState<number>(0);

   const canvasRef = useRef<HTMLCanvasElement>(null);
   const wrapperRef = useRef<HTMLDivElement>(null);
   const draggingRef = useRef(false);
   const rafRef = useRef<number | null>(null);
   const pendingRef = useRef<{ s: number; v: number } | null>(null);

   const safeHue = useMemo(() => normalizeHue(hue), [hue]);

   const marker = useMemo(() => {
      return {
         x: saturationValue.saturation * dimensions.w,
         y: (1 - saturationValue.value) * dimensions.h,
      };
   }, [saturationValue.saturation, saturationValue.value, dimensions.w, dimensions.h]);

   const pointerStyle = useMemo(
      () => ({
         left: marker.x,
         top: marker.y,
      }),
      [marker.x, marker.y],
   );

   useEffect(() => {
      const element = wrapperRef.current;
      if (!element) return;

      const observer = new ResizeObserver(entries => {
         const cr = entries[0]?.contentRect;
         if (!cr) return;

         const w = Math.floor(cr.width);
         const h = Math.floor(cr.height);
         if (w <= 0 || h <= 0) return;

         setDimensions(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
      });

      observer.observe(element);
      return () => observer.disconnect();
   }, []);

   useEffect(() => {
      const onResize = () => setRedrawTick(t => t + 1);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
   }, []);

   useEffect(() => {
      if (!hex) return;
      if (draggingRef.current) return;

      const { r, g, b } = hexToRgb(hex);
      const hsv = rgbToHsv(r, g, b);

      const next = { saturation: clamp01(hsv.s), value: clamp01(hsv.v) };

      setSaturationValue(prev => {
         const same =
            Math.abs(prev.saturation - next.saturation) < 1e-4 &&
            Math.abs(prev.value - next.value) < 1e-4;
         return same ? prev : next;
      });
   }, [hex]);

   useEffect(() => {
      const { w, h } = dimensions;
      if (!w || !h) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const hueRgb = hsvToRgb(safeHue, 1, 1);

      const gx = ctx.createLinearGradient(0, 0, w, 0);
      gx.addColorStop(0, 'rgb(255,255,255)');
      gx.addColorStop(1, `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`);
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, w, h);

      const gy = ctx.createLinearGradient(0, 0, 0, h);
      gy.addColorStop(0, 'rgba(0,0,0,0)');
      gy.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gy;
      ctx.fillRect(0, 0, w, h);
   }, [safeHue, dimensions.w, dimensions.h, redrawTick]);

   useEffect(() => {
      return () => {
         if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
   }, []);

   const commit = (nextS: number, nextV: number) => {
      const rgb = hsvToRgb(safeHue, nextS, nextV);
      const nextHex = rgbToHex(rgb.r, rgb.g, rgb.b);

      onHexChange?.(nextHex);
      onChange?.(nextHex);

      const id: string | null | undefined = activeStopId?.value;
      if (!id) return;

      stops.onChange(prev => ({
         ...prev,
         [id]: { ...prev[id], color: nextHex },
      }));
   };

   const scheduleCommit = (nextS: number, nextV: number) => {
      pendingRef.current = { s: nextS, v: nextV };

      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
         rafRef.current = null;

         const p = pendingRef.current;
         pendingRef.current = null;
         if (!p) return;

         commit(p.s, p.v);
      });
   };

   const pick = (clientX: number, clientY: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);

      const nextS = x;
      const nextV = 1 - y;

      setSaturationValue({ saturation: nextS, value: nextV });
      scheduleCommit(nextS, nextV);
   };

   const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      pick(e.clientX, e.clientY);
   };

   const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if ((e.buttons & 1) !== 1) return;
      pick(e.clientX, e.clientY);
   };

   const stopDrag = () => {
      draggingRef.current = false;
   };

   return (
      <div
         ref={wrapperRef}
         className={cn(s['color-square'], 'color-square', classNames?.square)}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
         onPointerUp={stopDrag}
         onPointerCancel={stopDrag}
      >
         <canvas ref={canvasRef} />
         <div
            className={cn(s.pointer, 'color-square-pointer', classNames?.pointer)}
            style={pointerStyle}
         />
      </div>
   );
};
