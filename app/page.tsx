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
            classNames={{
               wrapper: s['gradient-picker-wrapper'],
               gradientSlider: {
                  wrapper: s['gradient-slider-wrapper'],
               },
               hueSlider: {
                  wrapper: s['hue-slider-wrapper'],
               },
               alphaSlider: {
                  wrapper: s['alpha-slider-wrapper'],
               },
            }}
            onChange={setGradient}
            updateDelay={0}
         />
      </main>
   );
}
