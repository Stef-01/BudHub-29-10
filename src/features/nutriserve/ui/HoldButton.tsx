// A button that does something while held, with identical pointer, touch and keyboard behaviour:
// pointer down (captured) or Space/Enter down starts it; release, cancel, lost capture, blur or
// unmount always ends it, so a hold can never get stuck on.
import React, { useEffect, useRef } from 'react';

interface HoldButtonProps {
  onStart: () => void;
  onEnd: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  /** Shown as aria-pressed while held. */
  active?: boolean;
  title?: string;
}

export function HoldButton({ onStart, onEnd, disabled, className = '', children, active, ...rest }: HoldButtonProps) {
  const holding = useRef(false);
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
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          end();
        }
      }}
      onBlur={end}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
