'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import s from './alpha-slider.module.css';
import { ColorContext, GradientContext } from '../../context';
import {
   alphaFromRgba,
   clamp01,
   parseRgbaString,
   thumbLeftFromValue,
   valueFromClientX,
} from '../../helpers/color';
import { cn } from '../../helpers/string';

export type AlphaSliderClassNames = {
   wrapper: string;
   track: string;
   thumb: string;
   canvas: string;
};

type TProps = {
   classNames?: Partial<AlphaSliderClassNames>;
};

export const AlphaSlider = ({ classNames }: TProps) => {
   const { activeStopId: activeStop, stops } = useContext(GradientContext);
   const { rgba, onRgbaChange } = useContext(ColorContext);

   const canvasRef = useRef<HTMLCanvasElement>(null);
   const wrapperRef = useRef<HTMLDivElement>(null);

   const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

   useEffect(() => {
      const element = wrapperRef.current;
      if (!element) return;

      const resizeObserver = new ResizeObserver(entries => {
         const contentRect = entries[0]?.contentRect;
         if (!contentRect) return;

         const w = Math.floor(contentRect.width);
         const h = Math.floor(contentRect.height);
         if (w <= 0 || h <= 0) return;

         setDimensions(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
      });

      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
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

      const cell = 6;
      for (let y = 0; y < h; y += cell) {
         for (let x = 0; x < w; x += cell) {
            const odd = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 1;
            context.fillStyle = odd ? '#bdbdbd' : '#ffffff';
            context.fillRect(x, y, cell, cell);
         }
      }

      const parsed = parseRgbaString(rgba) ?? { r: 0, g: 0, b: 0, a: 1 };

      const gradient = context.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 0)`);
      gradient.addColorStop(1, `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 1)`);

      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);
   }, [dimensions.w, dimensions.h, rgba]);

   const safeAlpha = clamp01(alphaFromRgba(rgba));

   const thumbLeft = useMemo(() => {
      return thumbLeftFromValue(safeAlpha, dimensions.w);
   }, [safeAlpha, dimensions.w]);

   const thumbStyle = useMemo(() => ({ left: thumbLeft }), [thumbLeft]);
   const thumbInnerStyle = useMemo(() => ({ backgroundColor: rgba }), [rgba]);

   const rafRef = useRef<number | null>(null);
   const pendingAlphaRef = useRef<number | null>(null);

   const commitAlpha = (nextAlpha: number) => {
      const alpha = clamp01(nextAlpha);
      const id = activeStop.value;
      if (!id) return;

      const currentStop = stops.value[id];
      const nextColor = currentStop ? currentStop.color : rgba;

      const parsed = parseRgbaString(nextColor) ??
         parseRgbaString(rgba) ?? { r: 0, g: 0, b: 0, a: 1 };
      const nextRgba = `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;

      onRgbaChange(nextRgba);

      stops.onChange({
         ...stops.value,
         [id]: {
            ...stops.value[id],
            color: nextRgba,
         },
      });
   };

   const scheduleAlpha = (nextAlpha: number) => {
      pendingAlphaRef.current = nextAlpha;
      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
         rafRef.current = null;
         const alpha = pendingAlphaRef.current;
         pendingAlphaRef.current = null;
         if (alpha == null) return;
         commitAlpha(alpha);
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
      scheduleAlpha(valueFromClientX(clientX, rect));
   };

   const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pick(e.clientX);
   };

   const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
      if ((e.buttons & 1) !== 1) return;
      pick(e.clientX);
   };

   return (
      <section
         className={cn('alpha-slider-wrapper', classNames?.wrapper, s.wrapper)}
         ref={wrapperRef}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
      >
         <canvas
            ref={canvasRef}
            className={cn('alpha-slider-canvas', classNames?.canvas, s.canvas)}
         />
         <div className={cn('alpha-slider-track', classNames?.track, s.track)} />
         <div
            className={cn('alpha-slider-thumb', classNames?.thumb, s.thumb)}
            style={thumbStyle}
         >
            <div className={s.inner} style={thumbInnerStyle} />
         </div>
      </section>
   );
};
