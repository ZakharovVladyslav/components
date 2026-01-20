'use client';

import { useState } from 'react';

import { GradientPicker } from '../components';
import s from './page.module.css';

import { cn } from '@/components/gradient-picker/helpers/string';

export default function Home() {
   const [gradient, setGradient] = useState<string>(
      'linear-gradient(90deg, rgba(10, 10, 193, 1) 0%, rgba(163, 0, 255, 1) 100%)',
   );

   return (
      <main className={s.main} style={{ background: gradient }}>
         <GradientPicker
            gradient={gradient}
            childrenProps={{
               gradientSlider: {
                  classNames: {
                     wrapper: s['gradient-slider-wrapper'],
                  },
               },
               hueSlider: {
                  classNames: {
                     wrapper: s['hue-slider-wrapper'],
                  },
               },
               colorSquare: {
                  classNames: {
                     square: s['color-square'],
                  },
               },
               alphaSlider: {
                  classNames: {
                     wrapper: s['alpha-slider-wrapper'],
                  },
               },
               stopPosition: {},
            }}
            grid={[
               'color-square',
               {
                  className: cn(s.actions, s.section),
                  children: ['eye-dropper', 'gradient-formats'],
               },
               {
                  className: cn(s['stop-controls'], s.section),
                  children: ['stop-position', 'angle-input'],
               },
               {
                  className: cn(s.slider, s.section),
                  children: ['gradient-slider', 'stop-delete'],
               },
               'alpha-slider',
               'hue-slider',
               'preview',
               'gradient-string',
            ]}
            wrapperClassName={s['gradient-picker-wrapper']}
            onChange={setGradient}
            updateDelay={0}
         />
      </main>
   );
}
