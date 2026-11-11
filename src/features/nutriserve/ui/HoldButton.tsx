// A button that does something while held, with identical pointer, touch and keyboard behaviour:
// pointer down (captured) or Space/Enter down starts it; release, cancel, lost capture, blur or
// unmount always ends it, so a hold can never get stuck on.
//
// Switch access, screen-reader browse mode and voice control send only a click, never a press and
// release. A click that is not the tail end of a hold calls onTap instead (a fixed step), so those
// players can still pour and boost.
import React, { useEffect, useRef } from 'react';

/** A click this soon after a hold ended is that hold's own click, not a separate tap. */
const CLICK_AFTER_HOLD_MS = 600;

interface HoldButtonProps {
  onStart: () => void;
  onEnd: () => void;
  /** Called for a click that wasn't a hold (assistive tech, element.click()). */
  onTap?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  /** Shown as aria-pressed while held. */
  active?: boolean;
  title?: string;
}

export function HoldButton({ onStart, onEnd, onTap, disabled, className = '', children, active, ...rest }: HoldButtonProps) {
  const holding = useRef(false);
  const lastHoldEnd = useRef(-Infinity);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  const start = () => {
    if (holding.current || disabled) return;
    holding.current = true;
    onStart();
  };
  const end = () => {
    if (!holding.current) return;
    holding.current = false;
    lastHoldEnd.current = performance.now();
    endRef.current();
  };

  // Release on unmount (e.g. switching station mid-hold).
  useEffect(() => () => {
    if (holding.current) {
      holding.current = false;
      endRef.current();
    }
  }, []);

  return (
    <button
      type="button"
      className={`ns-hold ${className}`}
      disabled={disabled}
      aria-pressed={active ?? undefined}
      aria-label={rest['aria-label']}
      title={rest.title}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!e.repeat) start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          end();
        }
      }}
      onClick={() => {
        if (holding.current || performance.now() - lastHoldEnd.current < CLICK_AFTER_HOLD_MS) return;
        if (!disabled) onTap?.();
      }}
      onBlur={end}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
