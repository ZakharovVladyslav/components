import { ReactNode } from 'react';

export const renderIcon = (
   icon: Maybe<Nullable<Icon>>,
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
