'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

import {
   AlphaSlider,
   AlphaSliderClassNames,
   ColorSquare,
   ColorSquareClassNames,
   DeleteStop,
   DeleteStopClassNames,
   GradientSlider,
   GradientSliderClassNames,
   HueSlider,
   HueSliderClassNames,
} from './components';
import { HUE_MAX } from './components/hue-slider/const';
import { INITIAL_STOPS } from './const';
import { ColorContext, GradientContext } from './context';
import s from './gradient-picker.module.css';
import { parseLinearGradientToStops } from './helpers';
import { hexToHue } from './helpers/color';
import { cn } from './helpers/string';
import { Stops } from './types';

type ChildrenProps = {
   colorSquare?: {
      classNames?: Partial<ColorSquareClassNames>;
   };
   deleteStop?: {
      classNames?: Partial<DeleteStopClassNames>;
      icon?: ReactNode;
   };
   gradientSlider?: {
      classNames?: Partial<GradientSliderClassNames>;
      updateDelay?: number;
   };
   hueSlider?: {
      classNames?: Partial<HueSliderClassNames>;
   };
   alphaSlider?: {
      classNames?: Partial<AlphaSliderClassNames>;
   };
};

type TProps = {
   gradient: string;
   childrenProps?: ChildrenProps;
   wrapperClassName?: string;
   updateDelay?: number;
   onChange: (gradient: string) => void;
};

export const GradientPicker = ({
   gradient,
   updateDelay,
   childrenProps,
   wrapperClassName,
   onChange,
}: TProps) => {
   const [stops, setStops] = useState<Stops>(INITIAL_STOPS);
   const [stopsOrder, setStopsOrder] = useState<string[]>(Object.keys(INITIAL_STOPS));
   const [activeStopId, setActiveStopId] = useState<string | null>('stop1');

   const activeStop = activeStopId ? stops[activeStopId] : null;

   const [hex, setHex] = useState<string>(activeStop?.color ?? '#000000');
   const [hue, setHue] = useState<number>(hexToHue(activeStop?.color ?? '#000000'));
   const [opacity, setOpacity] = useState<number>(activeStop?.alpha ?? 1);

   const didInitRef = useRef<boolean>(false);

   useEffect(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;

      const parsed = parseLinearGradientToStops(gradient);
      if (!parsed) return;

      setStops(parsed);
      setStopsOrder(Object.keys(parsed));

      const firstStopId = Object.keys(parsed)[0] ?? null;

      setActiveStopId(firstStopId);

      if (firstStopId) {
         const firstParsedStop = parsed[firstStopId];
         setHex(firstParsedStop.color ?? '#000000');
         setHue(hexToHue(firstParsedStop.color ?? '#000000'));
         setOpacity(firstParsedStop.alpha ?? 1);
      }
   }, [gradient]);

   useEffect(() => {
      if (!activeStop) return;

      const nextHex = activeStop.color ?? '#000000';
      const nextOpacity = activeStop.alpha ?? 1;

      setHex(nextHex);
      setOpacity(nextOpacity);

      setHue(prevHue => {
         const computed = hexToHue(nextHex);
         if (computed === 0 && prevHue > 300) return HUE_MAX;
         return computed;
      });
   }, [activeStop]);

   const containerRef = useRef<HTMLDivElement>(null);

   return (
      <GradientContext.Provider
         value={{
            activeStopId: { value: activeStopId, onChange: setActiveStopId },
            stops: { value: stops, onChange: setStops },
            stopsOrder: { value: stopsOrder, onChange: setStopsOrder },
         }}
      >
         <ColorContext.Provider
            value={{
               hex,
               hue,
               alpha: opacity,
               onHexChange: setHex,
               onHueChange: setHue,
               onAlphaChange: setOpacity,
            }}
         >
            <section className={cn(s.wrapper, wrapperClassName)} ref={containerRef}>
               <ColorSquare classNames={childrenProps?.colorSquare?.classNames} />
               <DeleteStop
                  icon={childrenProps?.deleteStop?.icon}
                  classNames={childrenProps?.deleteStop?.classNames}
               />
               <GradientSlider
                  input={gradient}
                  updateDelay={childrenProps?.gradientSlider?.updateDelay ?? updateDelay}
                  classNames={childrenProps?.gradientSlider?.classNames}
                  onChange={onChange}
               />
               <HueSlider classNames={childrenProps?.hueSlider?.classNames} />
               <AlphaSlider classNames={childrenProps?.alphaSlider?.classNames} />
            </section>
         </ColorContext.Provider>
      </GradientContext.Provider>
   );
};
