import { FC, SVGProps } from 'react';

import { GradientFormats } from '.';
import { ConicGradientIcon, LinearGradientIcon, RadialGradientIcon } from '../../icons';

export const GRADIENT_FORMATS: Record<GradientFormats, FC<SVGProps<SVGSVGElement>>> = {
   'conic-gradient': ConicGradientIcon,
   'linear-gradient': LinearGradientIcon,
   'radial-gradient': RadialGradientIcon,
};
