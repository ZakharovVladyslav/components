import { useContext, useState } from 'react';

import s from './eye-dropper.module.css';
import { ColorContext, GradientContext } from '../../context';
import { hexToRgb, rgbToHue } from '../../helpers/color';
import { cn } from '../../helpers/string';
import { DropperIcon } from '../../icons';
import { Icon } from '../../types';

export type EyeDropperClassNames = {
   button?: string;
   active?: string;
   icon?: string;
};

export type EyeDropperProps = {
   classNames?: Partial<EyeDropperClassNames>;
   icon?: Icon;
};

export const EyeDropper = ({ classNames, icon }: EyeDropperProps) => {
   const { activeStopId, stops } = useContext(GradientContext);
   const { onHueChange, onRgbaChange } = useContext(ColorContext);

   const [active, setActive] = useState<boolean>(false);

   const pickColor = async () => {
      setActive(true);

      if ('EyeDropper' in window) {
         try {
            const eyeDropper = new window.EyeDropper!();
            const { sRGBHex } = await eyeDropper.open();

            const rgb = hexToRgb(sRGBHex);

            if (rgb) {
               const hue = rgbToHue(rgb.r, rgb.g, rgb.b);
               const newRgb = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;

               onRgbaChange(newRgb);
               onHueChange(hue);

               stops.onChange(prev => ({
                  ...prev,
                  [activeStopId.value!]: {
                     ...prev[activeStopId.value!],
                     color: newRgb,
                  },
               }));

               setActive(false);
            }
         } catch (e) {
            console.warn('EyeDropper canceled or failed', e);
         }
      } else {
         console.warn('EyeDropper API is not supported in this browser.');
      }
   };

   const iconNode =
      typeof icon === 'function'
         ? (() => {
              const Icon = icon;
              return (
                 <Icon className={cn(classNames?.icon, s.icon, 'eye-dropper-icon')} />
              );
           })()
         : (icon ?? null);

   return (
      <button
         className={cn(
            classNames?.button,
            active && classNames?.active,
            s.button,
            active && s.active,
            'eye-dropper',
         )}
         onClick={pickColor}
      >
         {iconNode ?? (
            <DropperIcon className={cn(classNames?.icon, s.icon, 'eye-dropper-icon')} />
         )}
      </button>
   );
};
