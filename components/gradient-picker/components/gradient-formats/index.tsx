import { ReactNode, useContext, useMemo } from 'react';

import { GRADIENT_FORMATS } from './const';
import s from './gradient-formats.module.css';
import { GradientContext } from '../../context';
import { cn } from '../../helpers/string';
import { Icon } from '../../types';

export type GradientFormats = 'linear-gradient' | 'radial-gradient' | 'conic-gradient';

export type GradientFormatsButtonClassNames = {
   base: string;
   activeBase: string;
   icon: string;
};

export type GradientFormatsClassNames = {
   wrapper?: string;
   button?: GradientFormatsButtonClassNames;
   buttons?: Record<GradientFormats, Partial<GradientFormatsButtonClassNames>>;
};

export type GradientFormatsProps = {
   allowedFormats?: GradientFormats[];
   classNames?: Partial<GradientFormatsClassNames>;
   icons?: Partial<Record<GradientFormats, Icon>>;
};

export const PickGradientFormats = ({
   allowedFormats,
   icons,
   classNames,
}: GradientFormatsProps) => {
   const { format, prefixes } = useContext(GradientContext);

   const formats = useMemo(() => {
      if (!allowedFormats || allowedFormats.length === 0) return GRADIENT_FORMATS;

      return Object.fromEntries(
         Object.entries(GRADIENT_FORMATS).filter(([key]) =>
            allowedFormats.includes(key as GradientFormats),
         ),
      ) as Partial<Record<GradientFormats, Icon>>;
   }, [allowedFormats]);

   const setDefaultsFor = (next: GradientFormats) => {
      format?.onChange(next);

      if (next === 'linear-gradient') {
         prefixes?.onChange(prev => ({ ...prev, 'linear-gradient': '' }));
         return;
      }

      if (next === 'radial-gradient') {
         if (!prefixes?.value['radial-gradient'])
            prefixes?.onChange(prev => ({
               ...prev,
               'radial-gradient': 'circle at center',
            }));
         return;
      }

      if (next === 'conic-gradient') {
         if (!prefixes?.value['conic-gradient'])
            prefixes?.onChange(prev => ({
               ...prev,
               'conic-gradient': 'from 90deg at 50% 50%',
            }));
      }
   };

   return (
      <div className={cn(classNames?.wrapper, 'gradient-formats-wrapper', s.wrapper)}>
         {Object.entries(formats).map(([key, DefaultIcon]) => {
            const k = key as GradientFormats;
            const override = icons?.[k];

            let content: ReactNode;

            if (override == null) {
               const isValidComponent = typeof DefaultIcon === 'function';
               content = isValidComponent ? (
                  <DefaultIcon
                     className={cn(
                        classNames?.button?.icon,
                        classNames?.buttons?.[k]?.icon,
                        'gradient-formats-icon',
                        s.icon,
                     )}
                  />
               ) : null;
            } else if (typeof override === 'function') {
               const OverrideIcon = override;
               content = (
                  <OverrideIcon
                     className={cn(
                        classNames?.button?.icon,
                        classNames?.buttons?.[k]?.icon,
                        'gradient-formats-icon',
                        s.icon,
                     )}
                  />
               );
            } else {
               content = override;
            }

            const isFormatActive = format?.value === key;

            return (
               <button
                  key={key}
                  id={`gradient-format-button-${key}`}
                  className={cn(
                     classNames?.button?.base,
                     isFormatActive && classNames?.button?.activeBase,
                     classNames?.buttons?.[k]?.base,
                     isFormatActive && classNames?.buttons?.[k]?.activeBase,
                     'gradient-formats-button',
                     s.button,
                     isFormatActive && s.active,
                  )}
                  aria-label={`${key}-format-button`}
                  aria-selected={isFormatActive ? 'true' : 'false'}
                  data-active={isFormatActive ? 'true' : 'false'}
                  type="button"
                  onClick={() => setDefaultsFor(k)}
               >
                  {content}
               </button>
            );
         })}
      </div>
   );
};
