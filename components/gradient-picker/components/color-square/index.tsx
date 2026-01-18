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
import {
   clamp01,
   hsvToRgb,
   parseRgbaString,
   rgbToHsv,
   rgbToRgbaString,
} from '../../helpers/color';
import { cn } from '../../helpers/string';

export type ColorSquareClassNames = {
   square: string;
   pointer: string;
};

type TProps = {
   classNames?: Partial<ColorSquareClassNames>;
   onChange?: (rgba: string) => void;
};

export const ColorSquare = ({ classNames, onChange }: TProps) => {
   const { rgba, hue, onRgbaChange } = useContext(ColorContext);
   const { activeStopId, stops } = useContext(GradientContext);

   const [saturationValue, setSaturationValue] = useState<{
      saturation: number;
      value: number;
   }>(() => ({
      saturation: 1,
      value: 1,
   }));

   const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
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
         const contentRect = entries[0]?.contentRect;
         if (!contentRect) return;

         const w = Math.floor(contentRect.width);
         const h = Math.floor(contentRect.height);
         if (w <= 0 || h <= 0) return;

         setDimensions(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
      });

      observer.observe(element);
      return () => observer.disconnect();
   }, []);

   useEffect(() => {
      const onResize = () => setRedrawTick(tick => tick + 1);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
   }, []);

   useEffect(() => {
      if (!rgba) return;
      if (draggingRef.current) return;

      const parsed = parseRgbaString(rgba);
      if (!parsed) return;

      const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
      const next = { saturation: clamp01(hsv.s), value: clamp01(hsv.v) };

      setSaturationValue(prev => {
         const same =
            Math.abs(prev.saturation - next.saturation) < 1e-4 &&
            Math.abs(prev.value - next.value) < 1e-4;
         return same ? prev : next;
      });
   }, [rgba]);

   useEffect(() => {
      const { w, h } = dimensions;
      if (!w || !h) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * devicePixelRatio);
      canvas.height = Math.round(h * devicePixelRatio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, w, h);

      const hueRgb = hsvToRgb(safeHue, 1, 1);

      const gradientX = context.createLinearGradient(0, 0, w, 0);
      gradientX.addColorStop(0, 'rgb(255,255,255)');
      gradientX.addColorStop(1, `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`);
      context.fillStyle = gradientX;
      context.fillRect(0, 0, w, h);

      const gradientY = context.createLinearGradient(0, 0, 0, h);
      gradientY.addColorStop(0, 'rgba(0,0,0,0)');
      gradientY.addColorStop(1, 'rgba(0,0,0,1)');
      context.fillStyle = gradientY;
      context.fillRect(0, 0, w, h);
   }, [safeHue, dimensions.w, dimensions.h, redrawTick]);

   useEffect(() => {
      return () => {
         if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
   }, []);

   const commit = (nextSaturation: number, nextValue: number) => {
      const parsed = parseRgbaString(rgba) ?? { r: 0, g: 0, b: 0, a: 1 };
      const rgb = hsvToRgb(safeHue, nextSaturation, nextValue);
      const nextRgba = rgbToRgbaString(rgb.r, rgb.g, rgb.b, parsed.a);

      onRgbaChange?.(nextRgba);
      onChange?.(nextRgba);

      const id: string | null | undefined = activeStopId?.value;
      if (!id) return;

      stops.onChange(prev => ({
         ...prev,
         [id]: { ...prev[id], color: nextRgba },
      }));
   };

   const scheduleCommit = (nextSaturation: number, nextValue: number) => {
      pendingRef.current = { s: nextSaturation, v: nextValue };

      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
         rafRef.current = null;

         const pending = pendingRef.current;
         pendingRef.current = null;
         if (!pending) return;

         commit(pending.s, pending.v);
      });
   };

   const pick = (clientX: number, clientY: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);

      const nextSaturation = x;
      const nextValue = 1 - y;

      setSaturationValue({ saturation: nextSaturation, value: nextValue });
      scheduleCommit(nextSaturation, nextValue);
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
