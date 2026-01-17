'use client';

import { useEffect, useRef, useState } from 'react';

import {
   AlphaSlider,
   AlphaSliderClassNames,
   ColorSquare,
   ColorSquareClassNames,
   GradientSlider,
   GradientSliderClassNames,
   HueSlider,
   HueSliderClassNames,
} from './components';
import { INITIAL_STOPS } from './const';
import { ColorContext, GradientContext } from './context';
import s from './gradient-picker.module.css';
import { parseLinearGradientToStops } from './helpers';
import { hexToHue } from './helpers/color';
import { cn } from './helpers/string';
import { Stops } from './types';

type ClassNames = {
   wrapper: string;
   alphaSlider: Partial<AlphaSliderClassNames>;
   hueSlider: Partial<HueSliderClassNames>;
   gradientSlider: Partial<GradientSliderClassNames>;
   colorSquare: Partial<ColorSquareClassNames>;
};

type TProps = {
   gradient: string;
   classNames?: Partial<ClassNames>;
   updateDelay?: number;
   onChange: (gradient: string) => void;
};

export const GradientPicker = ({
   gradient,
   updateDelay,
   classNames,
   onChange,
}: TProps) => {
   const [stops, setStops] = useState<Stops>(INITIAL_STOPS);
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

      const firstId = Object.keys(parsed)[0] ?? null;
      setActiveStopId(firstId);

      if (firstId) {
         const st = parsed[firstId];
         setHex(st.color ?? '#000000');
         setHue(hexToHue(st.color ?? '#000000'));
         setOpacity(st.alpha ?? 1);
      }
   }, [gradient]);

   useEffect(() => {
      if (!activeStop) return;
      setHex(activeStop.color);
      setHue(hexToHue(activeStop.color));
      setOpacity(activeStop.alpha ?? 1);
   }, [activeStopId]);

   const containerRef = useRef<HTMLDivElement>(null);

   return (
      <GradientContext.Provider
         value={{
            activeStopId: { value: activeStopId, onChange: setActiveStopId },
            stops: { value: stops, onChange: setStops },
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
            <section className={cn(s.wrapper, classNames?.wrapper)} ref={containerRef}>
               <ColorSquare classNames={classNames?.colorSquare} />
               <GradientSlider
                  input={gradient}
                  updateDelay={updateDelay}
                  classNames={classNames?.gradientSlider}
                  onChange={onChange}
               />
               <HueSlider classNames={classNames?.hueSlider} />
               <AlphaSlider classNames={classNames?.alphaSlider} />
            </section>
         </ColorContext.Provider>
      </GradientContext.Provider>
   );
};
