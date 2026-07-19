import { useEffect, useRef } from "react";

// Calls `handler` when a mousedown happens outside the element that `ref` points
// to. Pass `enabled` as false to skip listening entirely (e.g. while a menu is
// closed). The handler is kept in a ref so passing a fresh inline function each
// render does not re-subscribe the listener.
export function useClickOutside(ref, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onMouseDown = (e) => {
      const el = ref.current;
      if (el && !el.contains(e.target)) handlerRef.current(e);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, enabled]);
}
