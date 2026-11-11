// Station tabs along the bottom of the stage. Keys 1-4 switch stations (see NutriServeRemaster).
import React from 'react';
import { prepTargetUnits, type GameState, type StationId } from '../simulation/index.ts';
import { dishTicket } from './TicketRail.tsx';
import type { Dispatch } from './useNutriServeGame.ts';
import { STATION_COLORS } from './LayoutStudy.tsx';
import { box } from './stage.ts';
import { Dockable } from './Dockable.tsx';

export const STATIONS: StationId[] = ['order', 'build', 'prep', 'finish'];

/** Prep units this close to a slot's target count as "at its mark" (the last half second of cooking). */
const MARK_WINDOW_UNITS = 75;

/** Prep slots whose dish has reached its ticket's mark (and is still cooking): take it out now. */
export function slotsAtMark(state: GameState): number[] {
  const ready: number[] = [];
  for (const slot of state.prepSlots) {
    const dish = state.dishes.find((d) => d.id === slot.dishId);
    const ticket = dishTicket(state, dish);
    if (!dish?.prep || !ticket) continue;
    if (dish.prep.milliUnits / 1000 >= prepTargetUnits(ticket.order.prepLevel) - MARK_WINDOW_UNITS) ready.push(slot.index);
  }
  return ready;
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
            onClick={() => dispatch({ type: 'selectStation', station })}
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
