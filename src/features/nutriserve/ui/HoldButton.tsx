// A button that does something while held, with the same behaviour for mouse, touch, pen, keyboard
// and click-only assistive input.
//
// - Mouse: pressing starts the hold at once (captured); release, cancel, lost capture, blur or
//   unmount always ends it, so a hold can never get stuck on.
// - Touch and pen: a press only becomes a hold once the finger has stayed put for HOLD_DELAY_MS.
//   A finger that moves first is a scroll: nothing happens and the page scrolls. Once the hold has
//   started the page is kept still. A young hold (under CANCEL_WINDOW_MS from contact) whose finger
//   then travels more than CANCEL_DRAG_PX, mostly up or down, was a slow scroll after all: it is
//   cancelled (onCancel undoes it) and the page scrolls again. An older hold that drifts keeps
//   pouring. A quick tap is a short press. Only the finger that started the hold can end it.
// - Pressing a disabled control calls onBlocked, so the player can be told why.
// - A click counts as a click-only activation (onTap) only when no press is down and none ended in
//   the last CLICK_AFTER_HOLD_MS, whatever became of that press (a hold, a quick tap, a scroll that
//   wiggled, a press on a disabled control). Browsers send a click after many such presses.
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
/** Travel (CSS px), mostly vertical, that means a young touch hold was a slow scroll after all. */
export const CANCEL_DRAG_PX = 30;
/** Only a hold this young (ms from contact) can turn out to be a scroll. */
export const CANCEL_WINDOW_MS = 500;
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
  /** Called when a disabled control is pressed or clicked. */
  onBlocked?: () => void;
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

export function HoldButton({ onStart, onEnd, onCancel, onTap, onBlocked, disabled, className = '', children, active, ...rest }: HoldButtonProps) {
  const button = useRef<HTMLButtonElement>(null);
  const holding = useRef(false);
  /** The pointer that owns the hold (undefined for keyboard). */
  const owner = useRef<number | undefined>(undefined);
  const pressedAt = useRef(0);
  const lastHoldEnd = useRef(-Infinity);
  /** A touch/pen press: waiting to become a hold (timer set), or holding (timer cleared). */
  const touch = useRef<(Touching & { timer?: number }) | null>(null);
  const pressDown = useRef(false);
  /** The pointer whose press is down: another pointer's release must not end its timing. */
  const pressPointer = useRef<number | undefined>(undefined);
  const lastPressEnd = useRef(-Infinity);
  const endPress = () => {
    if (!pressDown.current) return;
    pressDown.current = false;
    lastPressEnd.current = performance.now();
  };
  /** A touch press on a disabled control: told why on release, unless it turned into a scroll. */
  const blockedTouch = useRef<Touching | null>(null);
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

  // A press released anywhere (it may have left the button) ends the press timing.
  useEffect(() => {
    const up = (e: PointerEvent) => {
      if (e.pointerId === pressPointer.current) endPress();
    };
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
    };
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
    [],
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
        if (e.button !== 0 || !e.isPrimary) return;
        pressDown.current = true; // every press, so its trailing click is never taken for a click-only tap
        pressPointer.current = e.pointerId;
        if (disabled) {
          if (e.pointerType === 'mouse') onBlocked?.();
          else blockedTouch.current = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
          return;
        }
        if (holding.current || touch.current) return;
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
        const bt = blockedTouch.current;
        if (bt && bt.id === e.pointerId && Math.hypot(e.clientX - bt.x, e.clientY - bt.y) > TOUCH_SLOP_PX) blockedTouch.current = null;
        const t = touch.current;
        if (!t || t.id !== e.pointerId) return;
        const dx = e.clientX - t.x;
        const dy = e.clientY - t.y;
        const moved = Math.hypot(dx, dy);
        if (t.timer && moved > TOUCH_SLOP_PX)
          clearTouch(); // moved before the hold began: a scroll
        else if (!t.timer && holding.current && moved > CANCEL_DRAG_PX && Math.abs(dy) > 2 * Math.abs(dx) && performance.now() - t.at < CANCEL_WINDOW_MS) {
          clearTouch(); // a slow scroll after all: undo, and let the page scroll again
          cancel();
        }
      }}
      onPointerUp={(e) => {
        endPress();
        if (blockedTouch.current?.id === e.pointerId) {
          blockedTouch.current = null;
          // Only if it is still disabled: a control that came back on during the press just ends it.
          if (cb.current.disabled) onBlocked?.();
          return;
        }
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
        endPress();
        blockedTouch.current = null;
        if (touch.current?.id === e.pointerId) clearTouch(); // the browser took the gesture (a scroll)
        if (isOwner(e.pointerId)) end(true);
      }}
      onLostPointerCapture={(e) => {
        if (!touch.current && isOwner(e.pointerId)) end();
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (e.repeat) return;
          if (disabled) onBlocked?.();
          else start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (owner.current === undefined) end();
        }
      }}
      onClick={() => {
        const now = performance.now();
        if (holding.current || touch.current || pressDown.current) return;
        // The click that ends any press (held, tapped, wiggled, scrolled, or on a disabled control) is that press's own.
        if (now - lastHoldEnd.current < CLICK_AFTER_HOLD_MS || now - lastPressEnd.current < CLICK_AFTER_HOLD_MS) return;
        if (disabled) onBlocked?.();
        else onTap?.();
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
