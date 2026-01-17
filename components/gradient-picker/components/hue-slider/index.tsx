'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import s from './hue-slider.module.css';
import { ColorContext, GradientContext } from '../../context';
import {
   hexWithHue,
   normalizeHue,
   thumbLeftFromValue,
   valueFromClientX,
} from '../../helpers/color';
import { cn } from '../../helpers/string';

/**
 * Class names for customizing the Hue Slider component.
 * @property {string} wrapper - Class name for the slider wrapper.
 * @property {string} thumb - Class name for the slider thumb.
 * @property {string} canvas - Class name for the slider canvas.
 */
export type HueSliderClassNames = {
   wrapper: string;
   thumb: string;
   canvas: string;
};

type TProps = {
   classNames?: Partial<HueSliderClassNames>;
};

export const HueSlider = ({ classNames }: TProps) => {
   const { activeStopId: activeStop, stops } = useContext(GradientContext);
   const { hex, hue, onHexChange, onHueChange } = useContext(ColorContext);

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

      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgb(255, 0, 0)');
      gradient.addColorStop(1 / 6, 'rgb(255, 255, 0)');
      gradient.addColorStop(2 / 6, 'rgb(0, 255, 0)');
      gradient.addColorStop(3 / 6, 'rgb(0, 255, 255)');
      gradient.addColorStop(4 / 6, 'rgb(0, 0, 255)');
      gradient.addColorStop(5 / 6, 'rgb(255, 0, 255)');
      gradient.addColorStop(1, 'rgb(255, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
   }, [dimensions.w, dimensions.h]);

   const thumbLeft = useMemo(() => {
      return thumbLeftFromValue(normalizeHue(hue) / 360, dimensions.w);
   }, [hue, dimensions.w]);

   const thumbStyle = useMemo(
      () => ({
         left: thumbLeft,
         backgroundColor: hex,
      }),
      [thumbLeft, hex],
   );

   const rafRef = useRef<number | null>(null);
   const pendingHueRef = useRef<number | null>(null);

   const commitHue = (nextHue: number) => {
      const h = normalizeHue(nextHue);
      const nextHex = hexWithHue(hex, h);

      onHueChange(h);
      onHexChange(nextHex);

      const id = activeStop.value;
      if (!id) return;

      stops.onChange({
         ...stops.value,
         [id]: {
            ...stops.value[id],
            color: nextHex,
         },
      });
   };

   const scheduleHue = (nextHue: number) => {
      pendingHueRef.current = nextHue;
      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
         rafRef.current = null;
         const h = pendingHueRef.current;
         pendingHueRef.current = null;
         if (h == null) return;
         commitHue(h);
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

      const t = valueFromClientX(clientX, rect);
      scheduleHue(t * 360);
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
         className={cn(s.wrapper, 'hue-slider-wrapper', classNames?.wrapper)}
         ref={wrapperRef}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
      >
         <canvas
            ref={canvasRef}
            className={cn(s.canvas, 'hue-slider-canvas', classNames?.canvas)}
         />
         <div
            className={cn(s.thumb, 'hue-slider-thumb', classNames?.thumb)}
            style={thumbStyle}
         />
      </section>
   );
};
