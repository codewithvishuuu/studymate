import { useEffect, useRef, useState, type ReactNode } from "react";

/* Subtle scroll reveal for landing sections: 12px rise over 240ms.
 * IntersectionObserver, once visible stays visible. CSS kills motion
 * entirely under prefers-reduced-motion. No animation library. */

export default function Reveal({ children, label }: { children: ReactNode; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-label={label} className={`reveal ${shown ? "is-visible" : ""}`}>
      {children}
    </div>
  );
}
