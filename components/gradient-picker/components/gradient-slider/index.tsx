import { PointerEvent, useContext, useEffect, useMemo, useRef, useState } from 'react';

import s from './gradient-slider.module.css';
import {
   applyJump,
   clampN,
   getStopInnerStyle,
   leftPxFromPercent,
   makeId,
   orderIdsByPosition,
   R,
   sameIds,
   stopGap,
} from './helpers';
import { ColorContext, GradientContext } from '../../context';
import { buildGradient, parseGradientToStops } from '../../helpers';
import { rgbaToHue } from '../../helpers/color';
import { debounce } from '../../helpers/function';
import { cn } from '../../helpers/string';
import { Stops } from '../../types';

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
   const { activeStopId, stops, stopsOrder, format, prefixes } =
      useContext(GradientContext);
   const { rgba, onRgbaChange, onHueChange } = useContext(ColorContext);

   const [draftPosition, setDraftPosition] = useState<Nullable<number>>(null);
   const [draggingStopId, setDraggingStopId] = useState<Nullable<string>>(null);
   const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

   const sliderRef = useRef<HTMLDivElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);

   const skipFirstEmitRef = useRef(true);
   const lastRawPosRef = useRef<Nullable<number>>(null);
   const blockRef = useRef<Nullable<{ neighborId: string; dir: -1 | 1 }>>(null);
   const pointerOffsetPxRef = useRef(0);

   const lastEmittedRef = useRef<string | null>(null);
   const debounceKeyRef = useRef(
      `gradient-picker:onChange:${Math.random().toString(36).slice(2)}`,
   );

   const sortedStops = useMemo(() => {
      return Object.values(stops.value ?? {})
         .slice()
         .sort((a, b) => a.position - b.position);
   }, [stops.value]);

   const previewStops = useMemo(() => {
      if (!draggingStopId || draftPosition == null) return sortedStops;

      return sortedStops
         .map(stop =>
            stop.id === draggingStopId ? { ...stop, position: draftPosition } : stop,
         )
         .slice()
         .sort((a, b) => a.position - b.position);
   }, [sortedStops, draggingStopId, draftPosition]);

   useEffect(() => {
      const desired = orderIdsByPosition(stops.value);
      const current = stopsOrder?.value ?? [];
      if (!sameIds(current, desired)) stopsOrder?.onChange(desired);
   }, [stops.value, stopsOrder]);

   useEffect(() => {
      if (!input) return;
      if (lastEmittedRef.current === input) return;

      const parsed = parseGradientToStops(input);
      if (!parsed) return;

      stops.onChange(parsed.stops);
      stopsOrder?.onChange(orderIdsByPosition(parsed.stops));

      const currentActive = activeStopId.value;
      const nextActive =
         (currentActive && parsed.stops[currentActive]
            ? currentActive
            : Object.keys(parsed.stops)[0]) ?? null;

      activeStopId.onChange(nextActive);

      if (nextActive) {
         const stop = parsed.stops[nextActive];
         onRgbaChange(stop.color ?? 'rgba(0, 0, 0, 1)');
         onHueChange(rgbaToHue(stop.color ?? 'rgba(0, 0, 0, 1)'));
      }

      format?.onChange(parsed.format);
      prefixes?.onChange(prev => ({
         ...prev,
         [parsed.format]: parsed.prefix || prev[parsed.format],
      }));
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

      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * devicePixelRatio);
      canvas.height = Math.round(h * devicePixelRatio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, w, h);

      const cell = 8;
      for (let y = 0; y < h; y += cell) {
         for (let x = 0; x < w; x += cell) {
            const odd = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 1;
            context.fillStyle = odd ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
            context.fillRect(x, y, cell, cell);
         }
      }

      const gradient = context.createLinearGradient(0, 0, w, 0);

      if (previewStops.length === 0) {
         gradient.addColorStop(0, 'rgba(0,0,0,0)');
         gradient.addColorStop(1, 'rgba(0,0,0,0)');
      } else if (previewStops.length === 1) {
         const stop = previewStops[0];
         gradient.addColorStop(0, stop.color);
         gradient.addColorStop(1, stop.color);
      } else {
         for (const stop of previewStops) {
            const p = clampN(stop.position, 0, 100) / 100;
            gradient.addColorStop(p, stop.color);
         }
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);
   }, [dimensions.w, dimensions.h, previewStops]);

   useEffect(() => {
      if (!onChange) return;

      if (skipFirstEmitRef.current) {
         skipFirstEmitRef.current = false;
         return;
      }

      const f = format?.value ?? 'linear-gradient';
      const prefixForFormat = prefixes?.value?.[f] ?? '';

      const gradientString = buildGradient(
         previewStops.map(s => ({ position: s.position, color: s.color })),
         { format: f, angle: 90, prefix: prefixForFormat },
      );

      lastEmittedRef.current = gradientString;
      debounce(() => onChange(gradientString), updateDelay ?? 0, debounceKeyRef.current);
   }, [previewStops, onChange, updateDelay, format?.value, prefixes?.value]);

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

      activeStopId.onChange(stop.id);
      onRgbaChange(stop.color ?? 'rgba(0, 0, 0, 1)');
      onHueChange(rgbaToHue(stop.color ?? 'rgba(0, 0, 0, 1)'));

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

      stops.onChange((prev: Stops) => {
         const nextStops: Stops = {
            ...prev,
            [draggingStopId]: { ...prev[draggingStopId], position: res.pos },
         };

         stopsOrder?.onChange(orderIdsByPosition(nextStops));
         return nextStops;
      });

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

      const nextStop = { id, position: safePos, color: rgba };

      stops.onChange((prev: Stops) => {
         const nextStops: Stops = { ...prev, [id]: nextStop };
         stopsOrder?.onChange(orderIdsByPosition(nextStops));
         return nextStops;
      });

      activeStopId.onChange(id);

      onRgbaChange(rgba);
      onHueChange(rgbaToHue(rgba));

      setDraggingStopId(id);
      pointerOffsetPxRef.current = 0;
      lastRawPosRef.current = safePos;
      blockRef.current = null;
      setDraftPosition(safePos);

      e.currentTarget.setPointerCapture(e.pointerId);
   };

   const onStopClick = (id: string) => () => {
      if (activeStopId.value === id) return;

      const stop = stops.value[id];
      if (!stop) return;

      activeStopId.onChange(stop.id);
      onRgbaChange(stop.color ?? 'rgba(0, 0, 0, 1)');
      onHueChange(rgbaToHue(stop.color ?? 'rgba(0, 0, 0, 1)'));
   };

   const orderedStopsForRender = useMemo(() => {
      const map = stops.value ?? {};
      const order = stopsOrder?.value ?? [];

      const fromOrder = order.map(id => map[id]).filter(Boolean) as Array<
         (typeof sortedStops)[number]
      >;
      const missing = Object.values(map).filter(stop => !order.includes(stop.id));

      return [...fromOrder, ...missing];
   }, [stops.value, stopsOrder, sortedStops]);

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

         {orderedStopsForRender.map((stop, index) => {
            const isSelected = activeStopId.value === stop.id;
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
