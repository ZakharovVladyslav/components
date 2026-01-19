import { useContext } from 'react';

import s from './delete-stop.module.css';
import { GradientContext } from '../../context';
import { cn } from '../../helpers/string';
import { BinIcon } from '../../icons';
import { Icon } from '../../types';

export type DeleteStopClassNames = {
   button: string;
   icon: string;
};

/**
 * Props for DeleteStop component
 * @typedef {Object} DeleteStopProps
 * @property {string | FC} [icon] - SVG code or React Functional Component for the delete icon
 */
export type DeleteStopProps = {
   icon?: Icon;
   classNames?: Partial<DeleteStopClassNames>;
};

export const DeleteStop = ({ icon, classNames }: DeleteStopProps) => {
   const { activeStopId, stops, stopsOrder } = useContext(GradientContext);

   const canStopBeDeleted = Object.keys(stops.value ?? {}).length > 2;

   const iconNode =
      typeof icon === 'function'
         ? (() => {
              const Icon = icon;
              return (
                 <Icon className={cn(classNames?.icon, s.icon, 'delete-stop-icon')} />
              );
           })()
         : (icon ?? null);

   const handleDeleteStop = () => {
      const activeId = activeStopId.value;
      if (!activeId) return;

      const allStops = stops.value ?? {};
      const allIds = Object.keys(allStops);

      if (allIds.length <= 2) return;

      const order = (stopsOrder?.value?.length ? stopsOrder.value : allIds).filter(
         id => allStops[id],
      );

      const idx = order.indexOf(activeId);
      if (idx === -1) return;

      const nextActiveId = order[idx + 1] ?? order[idx - 1] ?? null;
      if (!nextActiveId) return;

      const newStops = { ...allStops };
      delete newStops[activeId];

      const newOrder = order.filter(id => id !== activeId);

      stops.onChange(newStops);
      stopsOrder?.onChange(newOrder);
      activeStopId.onChange(nextActiveId);
   };

   return (
      <button
         type="button"
         disabled={!canStopBeDeleted}
         className={cn('delete-stop-button', classNames?.button, s.button)}
         onClick={handleDeleteStop}
      >
         {iconNode ?? (
            <BinIcon className={cn('delete-stop-icon', classNames?.icon, s.icon)} />
         )}
      </button>
   );
};
