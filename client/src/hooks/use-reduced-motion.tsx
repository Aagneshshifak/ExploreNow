import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

export function useOptimizedAnimations() {
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Enable animations after initial load, unless user prefers reduced motion
    if (!prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimationsEnabled(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [prefersReducedMotion]);

  return animationsEnabled;
}