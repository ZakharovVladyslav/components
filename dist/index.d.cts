import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode, ComponentType, SVGProps } from 'react';

type ColorSquareClassNames = {
    square: string;
    pointer: string;
};

type GradientSliderClassNames = {
    wrapper: string;
    stop: string;
    stops: string[];
};

type HueSliderClassNames = {
    wrapper: string;
    thumb: string;
    canvas: string;
};

type AlphaSliderClassNames = {
    wrapper: string;
    track: string;
    thumb: string;
    canvas: string;
};

type DeleteStopClassNames = {
    button: string;
    icon: string;
};

type GradientFormats = 'linear-gradient' | 'radial-gradient' | 'conic-gradient';
type GradientFormatsButtonClassNames = {
    base: string;
    activeBase: string;
    icon: string;
};
type GradientFormatsClassNames = {
    wrapper?: string;
    button?: GradientFormatsButtonClassNames;
    buttons?: Record<GradientFormats, Partial<GradientFormatsButtonClassNames>>;
};

type EyeDropperClassNames = {
    button?: string;
    active?: string;
    icon?: string;
};

type Nodes = 'gradient-slider' | 'color-square' | 'hue-slider' | 'alpha-slider' | 'stop-delete' | 'gradient-formats' | 'eye-dropper';
type GridItem = Nodes | {
    className?: string;
    children: (Nodes | GridItem)[];
};
type Grid = GridItem[];
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
    gradientFormats?: {
        classNames?: Partial<GradientFormatsClassNames>;
        allowedFormats?: GradientFormats[];
        icons?: Partial<Record<GradientFormats, ComponentType<SVGProps<SVGSVGElement>> | ReactNode>>;
    };
    eyeDropper?: {
        classNames?: EyeDropperClassNames;
        icon?: ComponentType<SVGProps<SVGSVGElement>> | ReactNode;
    };
};

type TProps = {
    gradient: string;
    childrenProps?: ChildrenProps;
    grid?: Grid;
    wrapperClassName?: string;
    updateDelay?: number;
    onChange: (gradient: string) => void;
};
declare const GradientPicker: ({ gradient, updateDelay, childrenProps, grid, wrapperClassName, onChange, }: TProps) => react_jsx_runtime.JSX.Element;

export { GradientPicker };
