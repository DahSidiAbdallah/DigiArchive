import { useCallback, useEffect, useRef } from 'react';

/**
 * A custom React hook for debouncing function calls.
 * 
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @param deps Array of dependencies that will trigger a reset of the debounce timer when changed
 * @returns Debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  
  // Clear timeout if component unmounts or dependencies change
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, deps);
  
  // eslint-disable-next-line
  return useCallback((...args: Parameters<T>) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    
    timeout.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay, ...deps]) as T;
}

export default useDebounce;
