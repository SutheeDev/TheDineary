import { useState, useEffect } from "react";

// Returns `value` after it has stopped changing for `delay` ms. Used by the
// search boxes so filtering waits until the user pauses typing.
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
