'use client';

import { Fragment, Key, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
   AlphaSlider,
   AngleInput,
   ColorSquare,
   DeleteStop,
   EyeDropper,
   GradientFormats,
   GradientSlider,
   GradientString,
   HueSlider,
   PickGradientFormats,
   Preview,
   StopPosition,
} from './components';
import { HUE_MAX } from './components/hue-slider/const';
import { INITIAL_STOPS } from './const';
import { ColorContext, GradientContext, GradientPrefixes } from './context';
import s from './gradient-picker.module.css';
import { parseGradientToStops } from './helpers';
import { rgbaToHue } from './helpers/color';
import { cn } from './helpers/string';
import { ChildrenProps, Grid, GridItem, Nodes, Stops } from './types';

type TProps = {
   gradient: string;
   childrenProps?: ChildrenProps;
   grid?: Grid;
   wrapperClassName?: string;
   updateDelay?: number;
   onChange: (gradient: string) => void;
};

const DEFAULT_PREFIXES: GradientPrefixes = {
   'linear-gradient': '',
   'radial-gradient': 'circle at center',
   'conic-gradient': 'from 90deg at 50% 50%',
};

export const GradientPicker = ({
   gradient,
   updateDelay,
   childrenProps,
   grid,
   wrapperClassName,
   onChange,
}: TProps) => {
   const [stops, setStops] = useState<Stops>(INITIAL_STOPS);
   const [stopsOrder, setStopsOrder] = useState<string[]>(Object.keys(INITIAL_STOPS));
   const [activeStopId, setActiveStopId] = useState<string | null>('stop1');
   const [format, setFormat] = useState<GradientFormats>('linear-gradient');
   const [prefixes, setPrefixes] = useState<GradientPrefixes>(DEFAULT_PREFIXES);
   const [angle, setAngle] = useState<number>(90);
   const [draggingStopId, setDraggingStopId] = useState<Nullable<string>>(null);
   const [draftPosition, setDraftPosition] = useState<Nullable<number>>(null);

   const activeStop = activeStopId ? stops[activeStopId] : null;

   const [rgba, setRgba] = useState<string>(activeStop?.color ?? 'rgba(0, 0, 0, 1)');
   const [hue, setHue] = useState<number>(
      rgbaToHue(activeStop?.color ?? 'rgba(0, 0, 0, 1)'),
   );

   const didInitRef = useRef<boolean>(false);

   useEffect(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;

      const parsed = parseGradientToStops(gradient);
      if (!parsed) return;

      setFormat(parsed.format);

      setPrefixes(prev => ({
         ...prev,
         [parsed.format]:
            parsed.prefix || prev[parsed.format] || DEFAULT_PREFIXES[parsed.format],
      }));

      setStops(parsed.stops);
      setStopsOrder(Object.keys(parsed.stops));

      const firstStopId = Object.keys(parsed.stops)[0] ?? null;
      setActiveStopId(firstStopId);

      if (firstStopId) {
         const firstParsedStop = parsed.stops[firstStopId];
         const nextRgba = firstParsedStop.color ?? 'rgba(0, 0, 0, 1)';
         setRgba(nextRgba);
         setHue(rgbaToHue(nextRgba));
      }
   }, [gradient]);

   useEffect(() => {
      if (!activeStop) return;

      const nextRgba = activeStop.color ?? 'rgba(0, 0, 0, 1)';
      setRgba(nextRgba);

      setHue(prevHue => {
         const computed = rgbaToHue(nextRgba);
         if (computed === 0 && prevHue > 300) return HUE_MAX;
         return computed;
      });
   }, [activeStop]);

   const MAP_ITEMS: Record<Nodes, ReactNode> = useMemo(
      () => ({
         'alpha-slider': <AlphaSlider {...childrenProps?.alphaSlider} />,
         'color-square': <ColorSquare {...childrenProps?.colorSquare} />,
         'gradient-slider': (
            <GradientSlider
               input={gradient}
               updateDelay={childrenProps?.gradientSlider?.updateDelay ?? updateDelay}
               classNames={childrenProps?.gradientSlider?.classNames}
               onChange={onChange}
            />
         ),
         'hue-slider': <HueSlider {...childrenProps?.hueSlider} />,
         'stop-delete': <DeleteStop {...childrenProps?.deleteStop} />,
         'gradient-formats': <PickGradientFormats {...childrenProps?.gradientFormats} />,
         'eye-dropper': <EyeDropper {...childrenProps?.eyeDropper} />,
         'angle-input': <AngleInput {...childrenProps?.angleInput} />,
         preview: <Preview {...childrenProps?.preview} gradient={gradient} />,
         'stop-position': <StopPosition {...childrenProps?.stopPosition} />,
         'gradient-string': (
            <GradientString {...childrenProps?.gradientString} gradient={gradient} />
         ),
      }),
      [childrenProps, gradient, onChange, updateDelay],
   );

   const renderGridItem = (item: Nodes | GridItem, key: Key): ReactNode => {
      if (typeof item === 'string') {
         return <Fragment key={key}>{MAP_ITEMS[item]}</Fragment>;
      }

      return (
         <div key={key} className={cn(item.className, s['map-item'])}>
            {item.children.map((child, idx) => renderGridItem(child, `${key}-${idx}`))}
         </div>
      );
   };

   return (
      <GradientContext.Provider
         value={{
            activeStopId: { value: activeStopId, onChange: setActiveStopId },
            stops: { value: stops, onChange: setStops },
            stopsOrder: { value: stopsOrder, onChange: setStopsOrder },
            format: { value: format, onChange: setFormat },
            prefixes: { value: prefixes, onChange: setPrefixes },
            angle: { value: angle, onChange: setAngle },
            draggingStopId: { value: draggingStopId, onChange: setDraggingStopId },
            draftPosition: { value: draftPosition, onChange: setDraftPosition },
         }}
      >
         <ColorContext.Provider
            value={{ rgba, hue, onRgbaChange: setRgba, onHueChange: setHue }}
         >
            <section className={cn(s.wrapper, wrapperClassName)}>
               {grid?.map((item, index) => renderGridItem(item, index))}
            </section>
         </ColorContext.Provider>
      </GradientContext.Provider>
   );
};
