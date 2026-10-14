"use client";
import { LazyMotion, domAnimation, MotionConfig, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
/** Content stays visible in server HTML; animation enhances the hydrated interface. */
export function Intro({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={false}
      animate={reduced ? { y: 0 } : { y: [12, 0] }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
export function HeroPhone({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className="hero-phone-motion"
      initial={false}
      whileInView={reduced ? { y: 0 } : { y: [0, -9, 0] }}
      viewport={{ once: true }}
      transition={reduced ? { duration: 0 } : { duration: 7, ease: "easeInOut", repeat: 1 }}
    >
      {children}
    </m.div>
  );
}
export function SectionReveal({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className="section-reveal"
      initial={false}
      whileInView={reduced ? { y: 0 } : { y: [16, 0] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
export function PageEnter({ children, id }: { children: ReactNode; id: string }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      key={id}
      className="workspace-view"
      initial={reduced ? false : { opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
