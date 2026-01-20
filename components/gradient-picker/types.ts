import { ComponentType, ReactNode, SVGProps } from 'react';

import {
   ColorSquareClassNames,
   DeleteStopClassNames,
   GradientSliderClassNames,
   HueSliderClassNames,
   AlphaSliderClassNames,
   GradientFormats,
   GradientFormatsClassNames,
   EyeDropperClassNames,
   AngleInputClassNames,
   StopPositionProps,
   GradientStringClassNames,
} from './components';

export type Stop = {
   position: number;
   color: string;
   id: string;
};

export type Stops = Record<string, Stop>;

export type Nodes =
   | 'gradient-slider'
   | 'color-square'
   | 'hue-slider'
   | 'alpha-slider'
   | 'stop-delete'
   | 'gradient-formats'
   | 'eye-dropper'
   | 'angle-input'
   | 'preview'
   | 'stop-position'
   | 'gradient-string';

export type GridItem = Nodes | { className?: string; children: (Nodes | GridItem)[] };
export type Grid = GridItem[];

export type ChildrenProps = {
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
   gradientFormats?: {
      classNames?: Partial<GradientFormatsClassNames>;
      allowedFormats?: GradientFormats[];
      icons?: Partial<
         Record<GradientFormats, ComponentType<SVGProps<SVGSVGElement>> | ReactNode>
      >;
   };
   eyeDropper?: {
      classNames?: EyeDropperClassNames;
      icon?: ComponentType<SVGProps<SVGSVGElement>> | ReactNode;
   };
   angleInput?: {
      icons?: {
         angle?: Icon;
         increment?: Icon;
         decrement?: Icon;
      };
      classNames?: AngleInputClassNames;
   };
   preview?: {
      className?: string;
   };
   stopPosition?: Partial<StopPositionProps>;
   gradientString?: {
      classNames?: GradientStringClassNames;
      icon?: Icon;
   };
};

export type Icon = Nullable<ComponentType<SVGProps<SVGSVGElement>> | ReactNode>;
