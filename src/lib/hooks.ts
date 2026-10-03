"use client";
import { useEffect, useRef } from "react";

/** Runs `fn` immediately and then every `ms` milliseconds. */
export function usePoll(fn: () => void | Promise<void>, ms: number, enabled = true) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (!enabled) return;
    ref.current();
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [ms, enabled]);
}
