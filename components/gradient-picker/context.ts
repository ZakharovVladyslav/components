import { createContext, Dispatch, SetStateAction } from 'react';

import { GradientFormats } from './components';
import { Stops } from './types';

interface Constituent<T> {
   value: T;
   onChange: Dispatch<SetStateAction<T>>;
}

export type GradientPrefixes = Record<GradientFormats, string>;

export interface IGradientContext {
   activeStopId: Constituent<Nullable<string>>;
   stops: Constituent<Stops>;
   stopsOrder?: Constituent<string[]>;
   format?: Constituent<GradientFormats>;
   prefixes?: Constituent<GradientPrefixes>;
   angle?: Constituent<number>;
}

const DEFAULT_PREFIXES: GradientPrefixes = {
   'linear-gradient': '',
   'radial-gradient': 'circle at center',
   'conic-gradient': 'from 90deg at 50% 50%',
};

export const GradientContext = createContext<IGradientContext>({
   activeStopId: {
      value: null,
      onChange: () => {},
   },
   stops: {
      value: {},
      onChange: () => {},
   },
   stopsOrder: {
      value: [],
      onChange: () => {},
   },
   format: {
      value: 'linear-gradient',
      onChange: () => {},
   },
   prefixes: {
      value: DEFAULT_PREFIXES,
      onChange: () => {},
   },
   angle: {
      value: 90,
      onChange: () => {},
   },
});

export interface IColorContext {
   rgba: string;
   hue: number;
   onRgbaChange: (rgba: string) => void;
   onHueChange: (hue: number) => void;
}

export const ColorContext = createContext<IColorContext>({
   rgba: 'rgba(0, 0, 0, 1)',
   hue: 0,
   onRgbaChange: () => {},
   onHueChange: () => {},
});
