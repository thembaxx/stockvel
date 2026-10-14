"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { XIcon } from "@phosphor-icons/react";
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const reduced = useReducedMotion();
  function requestClose() {
    if (reduced) onClose();
    else setClosing(true);
  }
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <m.dialog
      ref={ref}
      className={`dialog ${wide ? "dialog-wide" : ""}`}
      aria-labelledby={titleId}
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={closing ? { opacity: 0, y: 8, scale: 0.99 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.99 }}
      transition={{ duration: reduced ? 0 : closing ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (closing) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) requestClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={requestClose}
          disabled={closing}
        >
          <XIcon size={20} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </m.dialog>
  );
}
