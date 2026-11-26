"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Fades and lifts its content in once it scrolls into view. Runs once per element.
 * Styles live in globals.css under `.js [data-reveal]`; reduced motion shows content at once.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal="" className={className} style={{ "--reveal-delay": `${delay}ms` }}>
      {children}
    </Tag>
  );
}
