/**
 * useDebounce Hook
 *
 * Returns a debounced version of the provided value that only updates
 * after the specified delay has elapsed since the last change.
 * Useful for search inputs to avoid excessive API calls.
 *
 * Validates: Requirements 18.2
 */

import { useEffect, useState } from 'react';

/**
 * Debounces a value by the given delay in milliseconds.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 400);
 *
 * // debouncedSearch updates 400ms after the user stops typing
 * useBooks({ search: debouncedSearch });
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
