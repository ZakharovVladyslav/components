import s from './gradient-string.module.css';
import { cn } from '../../helpers/string';
import { ClipboardIcon } from '../../icons';
import { Icon } from '../../types';
import { renderIcon } from '../helpers';

export type GradientStringClassNames = {
   wrapper?: string;
   text?: string;
   copyButton?: string;
   copyIcon?: string;
};

export type GradientStringProps = {
   classNames?: GradientStringClassNames;
   gradient: string;
   icon?: Icon;
};

export const GradientString = ({ gradient, classNames, icon }: GradientStringProps) => {
   const copyIcon = renderIcon(
      icon,
      <ClipboardIcon />,
      cn(classNames?.copyIcon, s.icon, 'gradient-string-copy-icon'),
   );

   const handleCopy = () => {
      navigator.clipboard.writeText(gradient);

      alert('Gradient copied to clipboard!');
   };

   return (
      <div className={cn(classNames?.wrapper, s.wrapper, 'gradient-string-wrapper')}>
         <p className={cn(classNames?.text, s.text, 'gradient-string-text')}>
            {gradient}
         </p>

         <button
            className={cn(
               classNames?.copyButton,
               s.button,
               'gradient-string-copy-button',
            )}
            onClick={handleCopy}
         >
            {copyIcon}
         </button>
      </div>
   );
};
