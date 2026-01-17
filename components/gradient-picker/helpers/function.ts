const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounces a function call.
 * @param fn The function to debounce.
 * @param delay The debounce delay in milliseconds. Default is 500ms.
 * @param key The unique key for the debounce timer.
 */
export const debounce = (fn: () => void, delay = 500, key = 'default') => {
   const existing = timers.get(key);
   if (existing) {
      clearTimeout(existing);
      timers.delete(key);
   }

   if (delay <= 0) {
      fn();
      return;
   }

   const timer = setTimeout(() => {
      fn();
      timers.delete(key);
   }, delay);

   timers.set(key, timer);
};
