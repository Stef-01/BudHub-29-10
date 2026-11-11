// A button that does something while held, with the same behaviour for mouse, touch, pen, keyboard
// and click-only assistive input.
//
// - Mouse: pressing starts the hold at once (captured); release, cancel, lost capture, blur or
//   unmount always ends it, so a hold can never get stuck on.
// - Touch and pen: a press only becomes a hold once the finger has stayed put for HOLD_DELAY_MS.
//   A finger that moves first is a scroll: nothing happens and the page scrolls. Once the hold has
//   started the page is kept still, unless the finger then travels more than CANCEL_DRAG_PX (a slow
//   scroll): the hold is cancelled (onCancel undoes it) and the page scrolls again. A quick tap is a
//   short press. Only the finger that started the hold can end it.
// - Keyboard: Space or Enter down starts it, up ends it. Repeats are ignored (and never scroll).
// - Switch access, screen-reader browse mode and voice control send only a click, never a press and
//   release: a click that isn't the tail of a hold calls onTap.
//
// onEnd(short) says whether the hold was a quick press (under SHORT_PRESS_MS from first contact),
// so a control can treat a tap differently from a hold (e.g. boost latches on a tap). A hold ended
// by the control becoming disabled, or by unmounting, is never short.
//
// Disabled uses aria-disabled rather than the disabled attribute, so a control that disables
// itself under the player's finger (boost overheating) keeps keyboard focus.
import React, { useEffect, useRef } from 'react';

/** Touch/pen: how long a press must stay put before it counts as a hold rather than a scroll. */
export const HOLD_DELAY_MS = 120;
/** Movement (CSS px) that turns a touch press into a scroll before the hold starts. */
export const TOUCH_SLOP_PX = 10;
/** Travel (CSS px) after a touch hold started that means the player is scrolling after all. */
export const CANCEL_DRAG_PX = 30;
/** A press shorter than this, from first contact, is reported as a short press. */
export const SHORT_PRESS_MS = 180;
/** A click this soon after a hold ended is that hold's own click, not a separate tap. */
const CLICK_AFTER_HOLD_MS = 600;

interface HoldButtonProps {
  onStart: () => void;
  onEnd: (short: boolean) => void;
  /** A touch hold that turned out to be a scroll: undo it. Defaults to onEnd(false). */
  onCancel?: () => void;
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

interface Touching {
  id: number;
  x: number;
  y: number;
  at: number;
}

export function HoldButton({ onStart, onEnd, onCancel, onTap, disabled, className = '', children, active, ...rest }: HoldButtonProps) {
  const button = useRef<HTMLButtonElement>(null);
  const holding = useRef(false);
  /** The pointer that owns the hold (undefined for keyboard). */
  const owner = useRef<number | undefined>(undefined);
  const pressedAt = useRef(0);
  const lastHoldEnd = useRef(-Infinity);
  /** A touch/pen press: waiting to become a hold (timer set), or holding (timer cleared). */
  const touch = useRef<(Touching & { timer?: number }) | null>(null);
  const cb = useRef({ onStart, onEnd, onCancel, disabled });
  cb.current = { onStart, onEnd, onCancel, disabled };

  const start = (pointerId?: number, at = performance.now()) => {
    if (holding.current || cb.current.disabled) return;
    holding.current = true;
    owner.current = pointerId;
    pressedAt.current = at;
    cb.current.onStart();
  };
  const end = (forced = false) => {
    if (!holding.current) return;
    holding.current = false;
    owner.current = undefined;
    const now = performance.now();
    lastHoldEnd.current = now;
    cb.current.onEnd(!forced && now - pressedAt.current < SHORT_PRESS_MS);
  };
  const cancel = () => {
    if (!holding.current) return;
    holding.current = false;
    owner.current = undefined;
    lastHoldEnd.current = performance.now();
    if (cb.current.onCancel) cb.current.onCancel();
    else cb.current.onEnd(false);
  };
  const clearTouch = () => {
    if (touch.current?.timer) window.clearTimeout(touch.current.timer);
    touch.current = null;
  };

  // Once a touch hold has started, keep the page from scrolling under it, unless the finger has
  // travelled far enough to mean a scroll. Native and non-passive: React's touch listeners are
  // passive and can't prevent scrolling.
  useEffect(() => {
    const el = button.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (holding.current && touch.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  // A control that becomes disabled mid-hold lets go (never as a tap).
  useEffect(() => {
    if (disabled) {
      clearTouch();
      end(true);
    }
  });

  // Release on unmount (e.g. switching station mid-hold).
  useEffect(
    () => () => {
      clearTouch();
      if (holding.current) {
        holding.current = false;
        cb.current.onEnd(false);
      }
    },
    []
  );

  const isOwner = (id: number) => owner.current === undefined || owner.current === id;

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
        if (e.button !== 0 || !e.isPrimary || disabled || holding.current || touch.current) return;
        if (e.pointerType === 'mouse') {
          e.currentTarget.setPointerCapture(e.pointerId);
          start(e.pointerId);
          return;
        }
        const pressed: Touching & { timer?: number } = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
        pressed.timer = window.setTimeout(() => {
          if (touch.current !== pressed) return;
          pressed.timer = undefined;
          start(pressed.id, pressed.at);
        }, HOLD_DELAY_MS);
        touch.current = pressed;
      }}
      onPointerMove={(e) => {
        const t = touch.current;
        if (!t || t.id !== e.pointerId) return;
        const moved = Math.hypot(e.clientX - t.x, e.clientY - t.y);
        if (t.timer && moved > TOUCH_SLOP_PX) clearTouch(); // moved before the hold began: a scroll
        else if (!t.timer && holding.current && moved > CANCEL_DRAG_PX) {
          clearTouch(); // a slow scroll after all: undo, and let the page scroll again
          cancel();
        }
      }}
      onPointerUp={(e) => {
        const t = touch.current;
        if (t && t.id === e.pointerId) {
          const waiting = !!t.timer;
          clearTouch();
          if (waiting) {
            // A quick touch tap: a short press.
            start(t.id, t.at);
            end();
            return;
          }
        }
        if (isOwner(e.pointerId)) end();
      }}
      onPointerCancel={(e) => {
        if (touch.current?.id === e.pointerId) clearTouch(); // the browser took the gesture (a scroll)
        if (isOwner(e.pointerId)) end(true);
      }}
      onLostPointerCapture={(e) => {
        if (!touch.current && isOwner(e.pointerId)) end();
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
          if (owner.current === undefined) end();
        }
      }}
      onClick={() => {
        if (holding.current || touch.current || performance.now() - lastHoldEnd.current < CLICK_AFTER_HOLD_MS) return;
        if (!disabled) onTap?.();
      }}
      onBlur={() => {
        clearTouch();
        end(true);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
