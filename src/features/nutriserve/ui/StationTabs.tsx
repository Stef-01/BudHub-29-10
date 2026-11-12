// Station tabs along the bottom of the stage. Keys 1-4 switch stations (see NutriServeRemaster).
import React from 'react';
import { prepBandUnits, prepTargetUnits, upgradeEffects, type GameState, type StationId } from '../simulation/index.ts';
import { dishTicket } from './TicketRail.tsx';
import type { Dispatch } from './useNutriServeGame.ts';
import { STATION_COLORS } from './LayoutStudy.tsx';
import { box } from './stage.ts';
import { Dockable } from './Dockable.tsx';

export const STATIONS: StationId[] = ['order', 'build', 'prep', 'finish'];

/**
 * Prep slots whose dish has reached its ticket's perfect window (and is still cooking): take it out
 * now. The window opens 1 s on the flame before the mark (1.8 s with copper handis).
 */
export function slotsAtMark(state: GameState): number[] {
  const band = prepBandUnits(upgradeEffects(state.profile.upgrades));
  const ready: number[] = [];
  for (const slot of state.prepSlots) {
    const dish = state.dishes.find((d) => d.id === slot.dishId);
    const ticket = dishTicket(state, dish);
    if (!dish?.prep || !ticket) continue;
    if (dish.prep.milliUnits / 1000 >= prepTargetUnits(ticket.order.prepLevel) - band) ready.push(slot.index);
  }
  return ready;
}

/**
 * Bring the Done button of the most overdue at-mark slot into view (just below the pinned station
 * tabs on a phone, where the lower slots sit below the fold). Called when the player comes to Prep from
 * another station; it never moves focus, and does nothing when that button is already in view.
 */
export function revealPrepDone(state: GameState): void {
  const marked = slotsAtMark(state);
  if (marked.length === 0) return;
  const over = (index: number) => {
    const slot = state.prepSlots[index];
    const dish = state.dishes.find((d) => d.id === slot.dishId);
    const ticket = dishTicket(state, dish);
    return dish?.prep && ticket ? dish.prep.milliUnits / 1000 - prepTargetUnits(ticket.order.prepLevel) : 0;
  };
  const urgent = [...marked].sort((a, b) => over(b) - over(a))[0];
  // After the station has rendered (the dispatch that opened it renders before the next frame).
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const button = document.querySelector<HTMLElement>(`[data-prep-done="${urgent}"]`);
      button?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' as ScrollBehavior });
    })
  );
}

/**
 * On a phone, after switching to a station, bring its controls into view just below the pinned
 * tabs: Build from its ticket down to Send, Finish from its dish list down to Done, Order and Prep
 * from their first control (Prep with a handi at its mark brings that handi's Done into view
 * instead, see revealPrepDone). Without it the page stays wherever the last station left it, and
 * every switch on an upright phone began with a scroll (audit 13). Nothing moves when the controls
 * are already in view (a block taller than the screen: when its top is in the upper quarter), or on
 * a wide layout. It never moves focus.
 */
export function revealStation(state: GameState, station: StationId): void {
  if (station === 'prep' && slotsAtMark(state).length) {
    revealPrepDone(state);
    return;
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>('.ns-root.ns-compact');
      const main = root?.querySelector<HTMLElement>('.ns-dock-main');
      if (!root || !main?.firstElementChild) return;
      const bottom = main.getBoundingClientRect().bottom;
      // The pinned tabs cover the top of the screen above the controls (not when they sit beside them,
      // as on a phone held sideways, or scroll with the page, as at 400% zoom).
      const tabs = root.querySelector<HTMLElement>('.ns-dock-tabs');
      const t = tabs?.getBoundingClientRect();
      const m = main.getBoundingClientRect();
      const pinned = !!tabs && !!t && getComputedStyle(tabs).position === 'sticky' && t.right > m.left && t.left < m.right;
      const room = window.innerHeight - (pinned ? t.height : 0);
      // The longest block that fits, from the station's ticket (Build) or dish list (Finish) down to
      // its last control; else from its first control.
      const starts = [
        ...(station === 'build' ? [root.querySelector<HTMLElement>('.ns-dock-top'), root.querySelector<HTMLElement>('.ns-dock-aside:not(:empty)')] : []),
        ...(station === 'finish' ? [root.querySelector<HTMLElement>('.ns-dock-aside:not(:empty)')] : []),
        main,
      ]
        // Only what sits above the controls (when side by side, the ticket and dish list are in the other column).
        .filter((e): e is HTMLElement => !!e && e.getBoundingClientRect().right > m.left && e.getBoundingClientRect().left < m.right);
      const start = starts.find((e) => bottom - e.getBoundingClientRect().top <= room) ?? main;
      const block = start.getBoundingClientRect();
      const visibleTop = pinned ? Math.max(0, t.bottom) : 0;
      const fits = bottom - block.top <= room;
      const shown = block.top >= visibleTop && (fits ? bottom <= window.innerHeight : block.top <= visibleTop + window.innerHeight / 4);
      if (shown) return;
      // Up to 6 px below the tabs, less when the block only just fits (a pixel spare for rounding).
      const gap = fits ? Math.max(0, Math.min(6, Math.floor(room - (bottom - block.top)) - 1)) : 6;
      window.scrollBy({ top: block.top - (pinned ? t.height : 0) - gap, behavior: 'instant' as ScrollBehavior });
    })
  );
}

/** Small counts so the player can see what's waiting where without switching. */
function badge(state: GameState, station: StationId): number {
  switch (station) {
    case 'order':
      return state.day.customers.filter((c) => c.phase === 'at_counter').length;
    case 'build':
      return state.dishes.filter((d) => d.stage === 'building').length;
    case 'prep':
      return state.dishes.filter((d) => d.stage === 'built' || d.stage === 'prepping').length;
    case 'finish':
      return state.dishes.filter((d) => d.stage === 'prepped' || d.stage === 'finishing' || d.stage === 'ready').length;
  }
}

export function StationTabs({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  return (
    <Dockable slot="tabs" as="nav" region={box(0, 436, 640, 44)} className="ns-tabs" aria-label="Stations">
      {STATIONS.map((station, i) => {
        const { accent, label, hi } = STATION_COLORS[station];
        const count = badge(state, station);
        const active = state.selected.station === station;
        // Prep flags a handi at its mark, so it can be taken out in time from any station.
        const atMark = station === 'prep' ? slotsAtMark(state).length : 0;
        return (
          <button
            key={station}
            type="button"
            className="ns-tab"
            style={{ ['--tab' as string]: accent }}
            aria-pressed={active}
            aria-keyshortcuts={String(i + 1)}
            aria-label={`${label} station${count ? `, ${count} waiting` : ''}${atMark ? `, ${atMark} at the mark` : ''}`}
            onClick={() => {
              // Only coming from another station scrolls: tapping the current station's tab again
              // leaves the page where the player put it.
              const from = state.selected.station;
              dispatch({ type: 'selectStation', station });
              if (station !== from) revealStation(state, station);
            }}
          >
            <span>{label}</span>
            <small lang="hi">{hi}</small>
            {atMark > 0 ? (
              <em className="ns-tab-alert" aria-hidden="true">
                Done!
              </em>
            ) : (
              count > 0 && <em aria-hidden="true">{count}</em>
            )}
          </button>
        );
      })}
    </Dockable>
  );
}
