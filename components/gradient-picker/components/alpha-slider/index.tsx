'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import s from './alpha-slider.module.css';
import { clampByte } from './helpers';
import { ColorContext, GradientContext } from '../../context';
import {
   clamp01,
   hexToRgb,
   thumbLeftFromValue,
   valueFromClientX,
} from '../../helpers/color';
import { cn } from '../../helpers/string';

/**
 * Class names for customizing the Alpha Slider component.
 * @property {string} wrapper - Class name for the slider wrapper.
 * @property {string} track - Class name for the slider track.
 */
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
   const { hex, alpha, onAlphaChange } = useContext(ColorContext);

   const canvasRef = useRef<HTMLCanvasElement>(null);
   const wrapperRef = useRef<HTMLDivElement>(null);

   const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

   useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;

      const ro = new ResizeObserver(entries => {
         const cr = entries[0]?.contentRect;
         if (!cr) return;
         const w = Math.floor(cr.width);
         const h = Math.floor(cr.height);
         if (w <= 0 || h <= 0) return;
         setDimensions(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
      });

      ro.observe(el);
      return () => ro.disconnect();
   }, []);

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

      const cell = 6;
      for (let y = 0; y < h; y += cell) {
         for (let x = 0; x < w; x += cell) {
            const odd = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 1;
            ctx.fillStyle = odd ? '#bdbdbd' : '#ffffff';
            ctx.fillRect(x, y, cell, cell);
         }
      }

      const { r, g, b } = hex ? hexToRgb(hex) : { r: 0, g: 0, b: 0 };
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, `rgba(${clampByte(r)},${clampByte(g)},${clampByte(b)},0)`);
      grad.addColorStop(1, `rgba(${clampByte(r)},${clampByte(g)},${clampByte(b)},1)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
   }, [dimensions.w, dimensions.h, hex]);

   const safeAlpha = clamp01(Number.isFinite(alpha) ? alpha : 1);

   const thumbLeft = useMemo(() => {
      return thumbLeftFromValue(safeAlpha, dimensions.w);
   }, [safeAlpha, dimensions.w]);

   const thumbStyle = useMemo(() => ({ left: thumbLeft }), [thumbLeft]);
   const thumbInnerStyle = useMemo(
      () => ({ backgroundColor: hex, opacity: safeAlpha }),
      [hex, safeAlpha],
   );

   const rafRef = useRef<number | null>(null);
   const pendingAlphaRef = useRef<number | null>(null);

   const commitAlpha = (nextAlpha: number) => {
      const a = clamp01(nextAlpha);
      onAlphaChange(a);

      const id = activeStop.value;
      if (!id) return;

      stops.onChange({
         ...stops.value,
         [id]: {
            ...stops.value[id],
            alpha: a,
         },
      });
   };

   const scheduleAlpha = (nextAlpha: number) => {
      pendingAlphaRef.current = nextAlpha;
      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
         rafRef.current = null;
         const a = pendingAlphaRef.current;
         pendingAlphaRef.current = null;
         if (a == null) return;
         commitAlpha(a);
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
         className={cn(s.wrapper, 'alpha-slider-wrapper', classNames?.wrapper)}
         ref={wrapperRef}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
      >
         <canvas
            ref={canvasRef}
            className={cn(s.canvas, 'alpha-slider-canvas', classNames?.canvas)}
         />
         <div className={cn(s.track, 'alpha-slider-track', classNames?.track)} />
         <div
            className={cn(s.thumb, 'alpha-slider-thumb', classNames?.thumb)}
            style={thumbStyle}
         >
            <div className={s.inner} style={thumbInnerStyle} />
         </div>
      </section>
   );
};
