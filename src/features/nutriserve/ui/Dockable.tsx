// Responsive placement. On a wide screen every control sits on the 640x480 stage at its stage
// position. On a narrow screen the scaled stage is too small to read or touch (text would be ~6px,
// buttons ~13px), so controls render into a "dock" below the stage at full size, while the stage
// keeps the scene. Components wrap their controls in <Dockable> and don't care which mode is on.
import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

/**
 * Where a control goes in the dock: 'tabs' (station tabs), 'top' (ticket rail and ticket), 'aside'
 * (what a station shows beside its controls, such as Build's gauges: in the left column when the
 * dock is side by side, else just before the controls) and 'main' (the station's controls).
 */
export type DockSlot = 'top' | 'aside' | 'main' | 'tabs';

export interface LayoutMode {
  compact: boolean;
  slots: Partial<Record<DockSlot, HTMLElement | null>>;
}

export const LayoutContext = createContext<LayoutMode>({ compact: false, slots: {} });

export const useLayout = () => useContext(LayoutContext);

type DockableProps = {
  slot: DockSlot;
  /** Stage position (from box()/boxAuto()) used in wide mode. */
  region: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
  as?: 'div' | 'section' | 'aside' | 'nav' | 'p';
  /** Any other element props (event handlers, aria-*, role, tabIndex, ref) pass straight through. */
  [prop: string]: unknown;
};

export function Dockable({ slot, region, className = '', children, as = 'div', ...rest }: DockableProps) {
  const { compact, slots } = useLayout();
  const Tag = as as any;
  if (compact) {
    const target = slots[slot];
    if (!target) return null;
    return createPortal(
      <Tag className={`${className} ns-docked`} {...rest}>
        {children}
      </Tag>,
      target
    );
  }
  return (
    <Tag className={className} style={region} {...rest}>
      {children}
    </Tag>
  );
}
