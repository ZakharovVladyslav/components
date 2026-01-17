import { useRef, useState, PointerEvent, useContext, useMemo, useEffect } from 'react';

import s from './gradient-slider.module.css';
import {
   applyJump,
   buildLinearGradient,
   clamp,
   clampN,
   getStopInnerStyle,
   leftPxFromPercent,
   makeId,
   R,
   stopGap,
} from './helpers';
import { ColorContext, GradientContext } from '../../context';
import { parseStopsFromLinearGradient, stopsArrayToRecord } from '../../helpers';
import { hexToHue, hexToRgb } from '../../helpers/color';
import { debounce } from '../../helpers/function';
import { cn } from '../../helpers/string';
import { Stops } from '../../types';

/**
 * Class names for customizing the Gradient Slider component.
 * @property {string} wrapper - Class name for the slider wrapper.
 * @property {string} stop - Class name for each gradient stop.
 * @property {string[]} stops - Array of class names for individual gradient stops (by index).
 */
export type GradientSliderClassNames = {
   wrapper: string;
   stop: string;
   stops: string[];
};

type TProps = {
   input?: string;
   updateDelay?: number;
   classNames?: Partial<GradientSliderClassNames>;
   onChange?: (value: string) => void;
};

export const GradientSlider = ({
   classNames,
   input,
   onChange,
   updateDelay = 0,
}: TProps) => {
   const { activeStopId: activeStop, stops } = useContext(GradientContext);
   const { hex, alpha, onAlphaChange, onHexChange, onHueChange } =
      useContext(ColorContext);

   const [draftPosition, setDraftPosition] = useState<Nullable<number>>(null);
   const [draggingStopId, setDraggingStopId] = useState<Nullable<string>>(null);
   const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

   const sliderRef = useRef<HTMLDivElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);

   const skipFirstEmitRef = useRef(true);

   const lastRawPosRef = useRef<Nullable<number>>(null);
   const blockRef = useRef<Nullable<{ neighborId: string; dir: -1 | 1 }>>(null);
   const pointerOffsetPxRef = useRef(0);

   const didInitFromInputRef = useRef(false);

   const sortedStops = useMemo(() => {
      return Object.values(stops.value ?? {})
         .slice()
         .sort((a, b) => a.position - b.position);
   }, [stops.value]);

   const previewStops = useMemo(() => {
      if (!draggingStopId || draftPosition == null) return sortedStops;

      return sortedStops
         .map(st => (st.id === draggingStopId ? { ...st, position: draftPosition } : st))
         .slice()
         .sort((a, b) => a.position - b.position);
   }, [sortedStops, draggingStopId, draftPosition]);

   useEffect(() => {
      if (didInitFromInputRef.current) return;
      if (!input) return;

      const parsed = parseStopsFromLinearGradient(input);
      if (!parsed) {
         didInitFromInputRef.current = true;
         return;
      }

      const nextStops = stopsArrayToRecord(parsed.stops);
      const firstId = Object.keys(nextStops)[0] ?? null;

      stops.onChange(nextStops);
      activeStop.onChange(firstId);

      if (firstId) {
         const st = nextStops[firstId];
         onAlphaChange(st.alpha ?? 1);
         onHexChange(st.color ?? '#000000');
         onHueChange(hexToHue(st.color ?? '#000000'));
      }

      didInitFromInputRef.current = true;
   }, [input]);

   useEffect(() => {
      const element = sliderRef.current;
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

      const cell = 8;
      for (let y = 0; y < h; y += cell) {
         for (let x = 0; x < w; x += cell) {
            const odd = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 1;
            ctx.fillStyle = odd ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
            ctx.fillRect(x, y, cell, cell);
         }
      }

      const gradient = ctx.createLinearGradient(0, 0, w, 0);

      if (previewStops.length === 0) {
         gradient.addColorStop(0, 'rgba(0,0,0,0)');
         gradient.addColorStop(1, 'rgba(0,0,0,0)');
      } else if (previewStops.length === 1) {
         const st = previewStops[0];
         const { r, g, b } = hexToRgb(st.color);
         const a = clamp(typeof st.alpha === 'number' ? st.alpha : 1, 0, 1);
         gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
         gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a})`);
      } else {
         for (const st of previewStops) {
            const { r, g, b } = hexToRgb(st.color);
            const a = clamp(typeof st.alpha === 'number' ? st.alpha : 1, 0, 1);
            const p = clamp(st.position, 0, 100) / 100;
            gradient.addColorStop(p, `rgba(${r}, ${g}, ${b}, ${a})`);
         }
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
   }, [dimensions.w, dimensions.h, previewStops]);

   useEffect(() => {
      if (!onChange) return;

      if (skipFirstEmitRef.current) {
         skipFirstEmitRef.current = false;
         return;
      }

      const gradientStr = buildLinearGradient(
         previewStops.map(s => ({
            position: s.position,
            color: s.color,
            alpha: s.alpha,
         })),
         90,
      );

      debounce(() => onChange(gradientStr), updateDelay ?? 0, 'gradient-picker:onChange');
   }, [previewStops, onChange, updateDelay]);

   const getPosWithOffset = (clientX: number) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return 0;

      const x = clientX - pointerOffsetPxRef.current;

      const cxLocal = clampN(x - rect.left, R, rect.width - R);

      const t = (cxLocal - R) / Math.max(1, rect.width - 2 * R);
      return clampN(t * 100, 0, 100);
   };

   const onStopPointerDown = (id: string) => (e: PointerEvent) => {
      const stop = stops.value[id];
      if (!stop) return;

      activeStop.onChange(stop.id);
      onAlphaChange(stop.alpha ?? 1);
      onHexChange(stop.color ?? '#acacac');
      onHueChange(hexToHue(stop.color));

      setDraggingStopId(id);

      const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const targetCenterX = targetRect.left + targetRect.width / 2;
      pointerOffsetPxRef.current = e.clientX - targetCenterX;

      const raw = getPosWithOffset(e.clientX);
      const res = applyJump(
         raw,
         id,
         stops.value,
         lastRawPosRef.current,
         blockRef.current,
      );

      lastRawPosRef.current = raw;
      blockRef.current = res.block;
      setDraftPosition(res.pos);

      e.currentTarget.setPointerCapture(e.pointerId);
   };

   const onSliderPointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!draggingStopId) return;

      const raw = getPosWithOffset(e.clientX);
      const res = applyJump(
         raw,
         draggingStopId,
         stops.value,
         lastRawPosRef.current,
         blockRef.current,
      );

      lastRawPosRef.current = raw;
      blockRef.current = res.block;
      setDraftPosition(res.pos);
   };

   const resetDragState = () => {
      setDraggingStopId(null);
      setDraftPosition(null);
      lastRawPosRef.current = null;
      blockRef.current = null;
      pointerOffsetPxRef.current = 0;
   };

   const onSliderPointerUp = () => {
      if (!draggingStopId || draftPosition == null) {
         resetDragState();
         return;
      }

      const res = applyJump(
         draftPosition,
         draggingStopId,
         stops.value,
         lastRawPosRef.current,
         blockRef.current,
      );

      stops.onChange((prev: Stops) => ({
         ...prev,
         [draggingStopId]: { ...prev[draggingStopId], position: res.pos },
      }));

      resetDragState();
   };

   const getPosFromTrackClick = (clientX: number) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return 0;

      const cxLocal = clampN(clientX - rect.left, R, rect.width - R);
      const t = (cxLocal - R) / Math.max(1, rect.width - 2 * R);
      return clampN(t * 100, 0, 100);
   };

   const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest(`.${s.stop}`)) return;

      if ((e.buttons & 1) !== 1) return;

      const pos = getPosFromTrackClick(e.clientX);

      const id = makeId();

      const safePos = stopGap(pos, Object.values(stops.value), 4);

      const next = {
         id,
         position: safePos,
         color: hex,
         alpha,
      };

      stops.onChange((prev: Stops) => ({ ...prev, [id]: next }));
      activeStop.onChange(id);

      onHexChange(hex);
      onAlphaChange(alpha);
      onHueChange(hexToHue(hex));
   };

   const onStopClick = (id: string) => () => {
      if (activeStop.value === id) return;

      const stop = stops.value[id];
      if (!stop) return;

      activeStop.onChange(stop.id);
      onAlphaChange(stop.alpha ?? 1);
      onHexChange(stop.color ?? '#acacac');
      onHueChange(hexToHue(stop.color));
   };

   return (
      <section
         className={cn(s.slider, classNames?.wrapper)}
         ref={sliderRef}
         onPointerDown={onTrackPointerDown}
         onPointerMove={onSliderPointerMove}
         onPointerUp={onSliderPointerUp}
         onPointerCancel={onSliderPointerUp}
      >
         <canvas ref={canvasRef} className={s.canvas} />

         {Object.values(stops.value).map((stop, index) => {
            const isSelected = activeStop.value === stop.id;
            const isDragging = draggingStopId === stop.id;

            const position =
               isDragging && draftPosition != null ? draftPosition : stop.position;

            const leftPx = leftPxFromPercent(position, dimensions.w);

            return (
               <div
                  key={stop.id}
                  className={cn(
                     s.stop,
                     classNames?.stops?.[index] ?? classNames?.stop,
                     isSelected && s.active,
                  )}
                  style={{ left: `${leftPx}px` }}
                  onPointerDown={onStopPointerDown(stop.id)}
                  onClick={onStopClick(stop.id)}
               >
                  <div
                     className={s.inner}
                     style={getStopInnerStyle({ ...stop, position })}
                  />
               </div>
            );
         })}
      </section>
   );
};
