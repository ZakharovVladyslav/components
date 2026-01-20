import { ChangeEvent, useCallback, useContext, useEffect, useMemo } from 'react';

import s from './stop-position.module.css';
import { GradientContext } from '../../context';
import { cn } from '../../helpers/string';
import { ChevronIcon } from '../../icons';
import { Icon } from '../../types';
import { clampN, orderIdsByPosition } from '../gradient-slider/helpers';
import { renderIcon } from '../helpers';
import { enforceGapWithEdge } from './helpers';

export type StopPositionClassNames = {
   wrapper?: string;
   label?: string;
   inputWrapper?: string;
   input?: string;
   baseIcon?: string;
   suffix?: string;
   incrementButton?: string;
   incrementIcon?: string;
   decrementButton?: string;
   decrementIcon?: string;
};

export type StopPositionProps = {
   classNames?: StopPositionClassNames;
   label?: Nullable<string>;
   icons?: {
      base?: Icon;
      increment?: Icon;
      decrement?: Icon;
   };
   hideLabel?: boolean;
   hideSuffix?: boolean;
   hideSteppers?: boolean;
   suffix?: string;
};

export const StopPosition = ({
   classNames,
   label,
   suffix,
   icons,
   hideLabel,
   hideSuffix,
   hideSteppers,
}: StopPositionProps) => {
   const { activeStopId, stops, stopsOrder, draggingStopId, draftPosition } =
      useContext(GradientContext);

   const iconNode = renderIcon(
      icons?.base,
      null,
      cn(classNames?.baseIcon, s.icon, 'stop-position-icon'),
   );

   const incIcon = renderIcon(
      icons?.increment,
      <ChevronIcon
         className={cn(classNames?.incrementIcon, s.icon, 'angle-increment-icon')}
      />,
      cn(classNames?.incrementIcon, s.icon, 'angle-increment-icon'),
   );

   const decIcon = renderIcon(
      icons?.decrement,
      <ChevronIcon
         className={cn(classNames?.decrementIcon, s.icon, 'angle-decrement-icon')}
      />,
      cn(classNames?.decrementIcon, s.icon, 'angle-decrement-icon'),
   );

   const activeId = activeStopId?.value;

   const displayedPosition = useMemo(() => {
      const committed = activeId ? stops.value?.[activeId]?.position : null;

      const isDraggingActive =
         !!activeId && draggingStopId?.value === activeId && draftPosition?.value != null;

      return isDraggingActive ? (draftPosition!.value as number) : committed;
   }, [activeId, stops.value, draggingStopId?.value, draftPosition?.value]);

   const updatePositionBy = useCallback(
      (delta: number) => {
         const id = activeStopId.value;
         if (!id) return;

         const base =
            draggingStopId?.value === id && draftPosition?.value != null
               ? draftPosition.value
               : stops.value?.[id]?.position;

         if (base == null) return;

         const nextPos = clampN(base + delta, 0, 100);

         if (draggingStopId?.value === id) {
            const others = Object.values(stops.value ?? {}).filter(s => s.id !== id);
            const safePos = enforceGapWithEdge(nextPos, others, 4);

            if (draftPosition?.value !== safePos) {
               draftPosition?.onChange(safePos);
            }
            return;
         }

         stops.onChange(prev => {
            const current = prev?.[id];
            if (!current) return prev;

            const others = Object.values(prev).filter(s => s.id !== id);
            const safePos = enforceGapWithEdge(nextPos, others, 4);
            const nextStops = {
               ...prev,
               [id]: { ...current, position: safePos },
            };

            stopsOrder?.onChange(orderIdsByPosition(nextStops));
            return nextStops;
         });
      },
      [
         activeStopId?.value,
         draggingStopId?.value,
         draftPosition?.value,
         stops.value,
         stops.onChange,
         stopsOrder,
      ],
   );

   const handleIncrement = useCallback(() => updatePositionBy(1), [updatePositionBy]);
   const handleDecrement = useCallback(() => updatePositionBy(-1), [updatePositionBy]);

   useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleIncrement();
         } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDecrement();
         }
      };

      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
   }, [handleDecrement, handleIncrement]);

   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const id = activeStopId.value;
      if (!id) return;

      const raw = Number(e.target.value);
      if (Number.isNaN(raw)) return;

      const nextPos = clampN(raw, 0, 100);

      if (draggingStopId?.value === id) {
         const others = Object.values(stops.value ?? {}).filter(s => s.id !== id);
         const safePos = enforceGapWithEdge(nextPos, others, 4);

         if (draftPosition?.value !== safePos) {
            draftPosition?.onChange(safePos);
         }
         return;
      }

      stops.onChange(prev => {
         const current = prev?.[id];
         if (!current) return prev;

         const others = Object.values(prev).filter(s => s.id !== id);
         const safePos = enforceGapWithEdge(nextPos, others, 4);

         const nextStops = {
            ...prev,
            [id]: { ...current, position: safePos },
         };

         stopsOrder?.onChange(orderIdsByPosition(nextStops));
         return nextStops;
      });
   };

   return (
      <section className={cn(classNames?.wrapper, s.wrapper)}>
         {iconNode}

         {!hideLabel && label !== null && <p className={s.label}>{label ?? 'Stop'}</p>}

         <div
            className={cn(
               classNames?.inputWrapper,
               s['input-wrapper'],
               'stop-position-input-wrapper',
            )}
         >
            <input
               className={cn(classNames?.input, s.input, 'stop-position-input')}
               value={displayedPosition != null ? displayedPosition.toFixed(0) : ''}
               onChange={handleChange}
            />

            {!hideSuffix && (
               <p className={cn(classNames?.suffix, s.suffix, 'stop-position-suffix')}>
                  {suffix ?? '%'}
               </p>
            )}
         </div>

         {!hideSteppers && (icons?.decrement !== null || icons?.increment !== null) && (
            <div className={s.steppers}>
               {icons?.increment !== null && (
                  <button
                     className={cn(
                        classNames?.incrementButton,
                        s['stepper-button'],
                        s.increment,
                        'stop-position-increment-button',
                     )}
                     onClick={handleIncrement}
                  >
                     {incIcon}
                  </button>
               )}

               {icons?.decrement !== null && (
                  <button
                     className={cn(
                        classNames?.decrementButton,
                        s['stepper-button'],
                        s.decrement,
                        'stop-position-decrement-button',
                     )}
                     onClick={handleDecrement}
                  >
                     {decIcon}
                  </button>
               )}
            </div>
         )}
      </section>
   );
};
