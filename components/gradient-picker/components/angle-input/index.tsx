import {
   ChangeEvent,
   ReactNode,
   useCallback,
   useContext,
   useEffect,
   useRef,
} from 'react';

import s from './angle-input.module.css';
import { GradientContext } from '../../context';
import { cn } from '../../helpers/string';
import { AngleIcon, ChevronIcon } from '../../icons';
import { Icon } from '../../types';

export type AngleInputClassNames = {
   wrapper?: string;
   input?: string;
   icon?: string;
   incrementButton?: string;
   incrementIcon?: string;
   decrementButton?: string;
   decrementIcon?: string;
};

export type AngleInputProps = {
   icons?: {
      angle?: Icon;
      increment?: Icon;
      decrement?: Icon;
   };
   classNames?: AngleInputClassNames;
};

const renderIcon = (
   icon: Nullable<Maybe<Icon>>,
   fallback: ReactNode,
   className: string,
) => {
   if (icon === null) return null;

   if (!icon) return fallback;

   if (typeof icon === 'function') {
      const Cmp = icon;
      return <Cmp className={className} />;
   }

   return icon;
};

export const AngleInput = ({ classNames, icons }: AngleInputProps) => {
   const { angle, format } = useContext(GradientContext);

   const inputRef = useRef<HTMLInputElement>(null);

   const mainIcon = renderIcon(
      icons?.angle,
      <AngleIcon className={cn(classNames?.icon, s.icon, 'angle-input-icon')} />,
      cn(classNames?.icon, s.icon, 'angle-input-icon'),
   );

   const incIcon = renderIcon(
      icons?.increment,
      <ChevronIcon
         className={cn(classNames?.incrementIcon, s.icon, 'angle-increment-icon')}
      />,
      cn(classNames?.incrementIcon, s.icon, 'angle-increment-icon'),
   );

   const decIcon = renderIcon(
      icons?.decrement,
      <ChevronIcon
         className={cn(classNames?.decrementIcon, s.icon, 'angle-decrement-icon')}
      />,
      cn(classNames?.decrementIcon, s.icon, 'angle-decrement-icon'),
   );

   const handleIncrementAngle = useCallback(() => {
      angle?.onChange(((angle?.value ?? 0) + 1) % 360);
   }, [angle]);

   const handleDecrementAngle = useCallback(() => {
      angle?.onChange(((angle?.value ?? 0) - 1 + 360) % 360);
   }, [angle]);

   useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleIncrementAngle();
         } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDecrementAngle();
         }
      };

      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
   }, [handleDecrementAngle, handleIncrementAngle]);

   const handleUpdateAngle = (e: ChangeEvent<HTMLInputElement>) => {
      const newAngle = Number(e.target.value);
      if (!isNaN(newAngle)) {
         if (newAngle > 360) {
            angle?.onChange(360);
            return;
         }

         angle?.onChange(newAngle);
      }
   };

   const handleEmptySpaceClick = () => {
      inputRef?.current?.focus();
   };

   if (format?.value !== 'linear-gradient') return null;

   return (
      <section className={cn(classNames?.wrapper, 'angle-input-wrapper', s.wrapper)}>
         {mainIcon}

         <div className={s['input-wrapper']} onClick={handleEmptySpaceClick}>
            <input
               value={angle?.value ?? 90}
               ref={inputRef}
               className={cn(classNames?.input, 'angle-input-field', s.input)}
               onChange={handleUpdateAngle}
            />
            <span className={s.degree}>°</span>
         </div>

         {(icons?.decrement !== null || icons?.increment !== null) && (
            <div className={s.steppers}>
               {icons?.increment !== null && (
                  <button
                     className={cn(
                        classNames?.incrementButton,
                        s['stepper-button'],
                        s.increment,
                        'angle-inrcement-button',
                     )}
                     onClick={handleIncrementAngle}
                  >
                     {incIcon}
                  </button>
               )}

               {icons?.decrement !== null && (
                  <button
                     className={cn(
                        classNames?.decrementButton,
                        s['stepper-button'],
                        s.decrement,
                        'angle-decrement-button',
                     )}
                     onClick={handleDecrementAngle}
                  >
                     {decIcon}
                  </button>
               )}
            </div>
         )}
      </section>
   );
};
