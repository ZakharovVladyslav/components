'use client';

import { useState } from 'react';

import { GradientPicker } from '../components';
import s from './page.module.css';

export default function Home() {
   const [gradient, setGradient] = useState<string>(
      'linear-gradient(90deg, #0000ff 50%,  #00ff00 90%)',
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
               alphaSlider: {
                  classNames: {
                     wrapper: s['alpha-slider-wrapper'],
                  },
               },
            }}
            wrapperClassName={s['gradient-picker-wrapper']}
            onChange={setGradient}
            updateDelay={0}
         />
      </main>
   );
}
