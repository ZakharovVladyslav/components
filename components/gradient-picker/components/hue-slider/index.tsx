'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { HUE_MAX } from './const';
import s from './hue-slider.module.css';
import { ColorContext, GradientContext } from '../../context';
import { normalizeHue, parseRgbaString, rgbaWithHue } from '../../helpers/color';
import { clamp } from '../../helpers/number';
import { cn } from '../../helpers/string';

export type HueSliderClassNames = {
   wrapper: string;
   thumb: string;
   canvas: string;
};

type TProps = {
   classNames?: Partial<HueSliderClassNames>;
};

export const HueSlider = ({ classNames }: TProps) => {
   const { activeStopId: activeStopIdConstituent, stops } = useContext(GradientContext);
   const { rgba, hue, onRgbaChange, onHueChange } = useContext(ColorContext);

   const canvasRef = useRef<HTMLCanvasElement>(null);
   const wrapperRef = useRef<HTMLElement>(null);
   const thumbRef = useRef<HTMLDivElement>(null);

   const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
   const [thumbRadius, setThumbRadius] = useState<number>(12);

   useEffect(() => {
      const element = wrapperRef.current;
      if (!element) return;

      const observer = new ResizeObserver(entries => {
         const contentRect = entries[0]?.contentRect;
         if (!contentRect) return;

         const width = Math.floor(contentRect.width);
         const height = Math.floor(contentRect.height);
         if (width <= 0 || height <= 0) return;

         setDimensions(prev =>
            prev.w === width && prev.h === height ? prev : { w: width, h: height },
         );

         const thumbRect = thumbRef.current?.getBoundingClientRect();
         if (thumbRect?.width) setThumbRadius(Math.max(0, thumbRect.width / 2));
      });

      observer.observe(element);
      return () => observer.disconnect();
   }, []);

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

      const gradient = context.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgb(255, 0, 0)');
      gradient.addColorStop(1 / 6, 'rgb(255, 255, 0)');
      gradient.addColorStop(2 / 6, 'rgb(0, 255, 0)');
      gradient.addColorStop(3 / 6, 'rgb(0, 255, 255)');
      gradient.addColorStop(4 / 6, 'rgb(0, 0, 255)');
      gradient.addColorStop(5 / 6, 'rgb(255, 0, 255)');
      gradient.addColorStop(1, 'rgb(255, 0, 0)');

      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);
   }, [dimensions.w, dimensions.h]);

   const thumbLeft = useMemo(() => {
      const value01 = normalizeHue(hue) / 360;
      const width = dimensions.w || 1;
      return thumbRadius + clamp(value01, 0, 1) * Math.max(1, width - 2 * thumbRadius);
   }, [hue, dimensions.w, thumbRadius]);

   const thumbStyle = useMemo(
      () => ({ left: thumbLeft, backgroundColor: rgba }),
      [thumbLeft, rgba],
   );

   const rafRef = useRef<number | null>(null);
   const pendingHueRef = useRef<number | null>(null);

   const commitHue = (nextHue: number) => {
      const normalized = normalizeHue(nextHue);
      const nextRgba = rgbaWithHue(rgba, normalized);

      onHueChange(normalized);
      onRgbaChange(nextRgba);

      const id = activeStopIdConstituent.value;
      if (!id) return;

      stops.onChange(prev => ({
         ...prev,
         [id]: {
            ...prev[id],
            color: nextRgba,
         },
      }));
   };

   const scheduleHue = (nextHue: number) => {
      pendingHueRef.current = nextHue;
      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
         rafRef.current = null;
         const queued = pendingHueRef.current;
         pendingHueRef.current = null;
         if (queued == null) return;
         commitHue(queued);
      });
   };

   useEffect(() => {
      return () => {
         if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
   }, []);

   const pick = (clientX: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clampedClientX = clamp(
         clientX - rect.left,
         thumbRadius,
         rect.width - thumbRadius,
      );
      const t =
         (clampedClientX - thumbRadius) / Math.max(1, rect.width - 2 * thumbRadius);

      const nextHue = Math.min(t * 360, HUE_MAX);
      scheduleHue(nextHue);
   };

   const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pick(e.clientX);
   };

   const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
      if ((e.buttons & 1) !== 1) return;
      pick(e.clientX);
   };

   useEffect(() => {
      const parsed = parseRgbaString(rgba);
      if (!parsed) return;

      const computedHue = normalizeHue(hue);
      if (computedHue === 0) return;

      const id = activeStopIdConstituent.value;
      if (!id) return;

      const current = stops.value?.[id];
      if (!current) return;
   }, [rgba, hue, activeStopIdConstituent.value]);

   return (
      <section
         className={cn(classNames?.wrapper, 'hue-slider-wrapper', s.wrapper)}
         ref={wrapperRef}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
      >
         <canvas
            ref={canvasRef}
            className={cn(classNames?.canvas, 'hue-slider-canvas', s.canvas)}
         />
         <div
            ref={thumbRef}
            className={cn(classNames?.thumb, 'hue-slider-thumb', s.thumb)}
            style={thumbStyle}
         />
      </section>
   );
};
