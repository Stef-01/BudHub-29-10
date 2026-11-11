// A button that does something while held, with the same behaviour for mouse, touch, pen, keyboard
// and click-only assistive input.
//
// - Mouse: pressing starts the hold at once (captured); release, cancel, lost capture, blur or
//   unmount always ends it, so a hold can never get stuck on.
// - Touch and pen: a press only becomes a hold once the finger has stayed put for HOLD_DELAY_MS.
//   A finger that moves first is a scroll: nothing happens and the page scrolls. Once the hold has
//   started, the page is kept from scrolling under it. A quick tap is a short press.
// - Keyboard: Space or Enter down starts it, up ends it. Repeats are ignored (and never scroll).
// - Switch access, screen-reader browse mode and voice control send only a click, never a press and
//   release: a click that isn't the tail of a hold calls onTap.
//
// onEnd(short) says whether the hold was a quick press (under SHORT_PRESS_MS), so a control can treat
// a tap differently from a hold (e.g. boost latches on a tap).
//
// Disabled uses aria-disabled rather than the disabled attribute, so a control that disables
// itself under the player's finger (boost overheating) keeps keyboard focus.
import React, { useEffect, useRef } from 'react';

/** Touch/pen: how long a press must stay put before it counts as a hold rather than a scroll. */
export const HOLD_DELAY_MS = 120;
/** Movement (CSS px) that turns a touch press into a scroll. */
export const TOUCH_SLOP_PX = 10;
/** A hold shorter than this is reported as a short press. */
export const SHORT_PRESS_MS = 180;
/** A click this soon after a hold ended is that hold's own click, not a separate tap. */
const CLICK_AFTER_HOLD_MS = 600;

interface HoldButtonProps {
  onStart: () => void;
  onEnd: (short: boolean) => void;
  /** Called for a click that wasn't a press (assistive tech, element.click()). */
  onTap?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Shown as aria-pressed while held (or latched). */
  active?: boolean;
  title?: string;
}

export function HoldButton({ onStart, onEnd, onTap, disabled, className = '', children, active, ...rest }: HoldButtonProps) {
  const button = useRef<HTMLButtonElement>(null);
  const holding = useRef(false);
  const startedAt = useRef(0);
  const lastHoldEnd = useRef(-Infinity);
  const pending = useRef<{ id: number; x: number; y: number; timer: number } | null>(null);
  const cb = useRef({ onStart, onEnd, disabled });
  cb.current = { onStart, onEnd, disabled };

  const start = () => {
    if (holding.current || cb.current.disabled) return;
    holding.current = true;
    startedAt.current = performance.now();
    cb.current.onStart();
  };
  const end = () => {
    if (!holding.current) return;
    holding.current = false;
    const now = performance.now();
    lastHoldEnd.current = now;
    cb.current.onEnd(now - startedAt.current < SHORT_PRESS_MS);
  };
  const cancelPending = () => {
    if (!pending.current) return;
    window.clearTimeout(pending.current.timer);
    pending.current = null;
  };

  // Once a touch hold has started, keep the page from scrolling under it. Native, non-passive:
  // React's touch listeners are passive and can't prevent scrolling.
  useEffect(() => {
    const el = button.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (holding.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  // A control that becomes disabled mid-hold lets go.
  useEffect(() => {
    if (disabled) {
      cancelPending();
      end();
    }
  });

  // Release on unmount (e.g. switching station mid-hold).
  useEffect(
    () => () => {
      cancelPending();
      if (holding.current) {
        holding.current = false;
        cb.current.onEnd(false);
      }
    },
    [],
  );

  return (
    <button
      ref={button}
      type="button"
      className={`ns-hold ${className}`}
      aria-disabled={disabled || undefined}
      aria-pressed={active ?? undefined}
      aria-label={rest['aria-label']}
      aria-describedby={rest['aria-describedby']}
      title={rest.title}
      onPointerDown={(e) => {
        if (e.button !== 0 || !e.isPrimary || disabled || holding.current || pending.current) return;
        if (e.pointerType === 'mouse') {
          e.currentTarget.setPointerCapture(e.pointerId);
          start();
          return;
        }
        const id = e.pointerId;
        pending.current = {
          id,
          x: e.clientX,
          y: e.clientY,
          timer: window.setTimeout(() => {
            if (pending.current?.id !== id) return;
            pending.current = null;
            start();
          }, HOLD_DELAY_MS),
        };
      }}
      onPointerMove={(e) => {
        const p = pending.current;
        if (p && p.id === e.pointerId && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TOUCH_SLOP_PX) cancelPending();
      }}
      onPointerUp={(e) => {
        const p = pending.current;
        if (p && p.id === e.pointerId) {
          // A quick touch tap: a short press.
          cancelPending();
          start();
          end();
          return;
        }
        end();
      }}
      onPointerCancel={() => {
        cancelPending(); // the browser took the gesture (a scroll): nothing happened
        end();
      }}
      onLostPointerCapture={() => {
        if (!pending.current) end();
      }}
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
        if (holding.current || pending.current || performance.now() - lastHoldEnd.current < CLICK_AFTER_HOLD_MS) return;
        if (!disabled) onTap?.();
      }}
      onBlur={() => {
        cancelPending();
        end();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
