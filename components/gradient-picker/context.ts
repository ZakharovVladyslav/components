import { createContext, Dispatch, SetStateAction } from 'react';

import { Stops } from './types';

interface Constituent<T> {
   value: T;
   onChange: Dispatch<SetStateAction<T>>;
}

export interface IGradientContext {
   activeStopId: Constituent<Nullable<string>>;
   stops: Constituent<Stops>;
}

export const GradientContext = createContext<IGradientContext>({
   activeStopId: {
      value: null,
      onChange: () => {},
   },
   stops: {
      value: {},
      onChange: () => {},
   },
});

// --------------------------------------------------------------------

export interface IColorContext {
   hex: string;
   hue: number;
   alpha: number;
   onHexChange: (hex: string) => void;
   onHueChange: (hue: number) => void;
   onAlphaChange: (opacity: number) => void;
}

export const ColorContext = createContext<IColorContext>({
   hex: '#000000',
   hue: 0,
   alpha: 1,
   onHexChange: () => {},
   onHueChange: () => {},
   onAlphaChange: () => {},
});
