// Station tabs along the bottom of the stage. Keys 1-4 switch stations (see NutriServeRemaster).
import React from 'react';
import type { Command, CommandResult, GameState, StationId } from '../simulation/index.ts';
import { STATION_COLORS } from './LayoutStudy.tsx';
import { box } from './stage.ts';
import { Dockable } from './Dockable.tsx';

export const STATIONS: StationId[] = ['order', 'build', 'prep', 'finish'];

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

export function StationTabs({ state, dispatch }: { state: GameState; dispatch: (c: Command) => CommandResult }) {
  return (
    <Dockable slot="tabs" as="nav" region={box(0, 436, 640, 44)} className="ns-tabs" aria-label="Stations">
      {STATIONS.map((station, i) => {
        const { accent, label, hi } = STATION_COLORS[station];
        const count = badge(state, station);
        const active = state.selected.station === station;
        return (
          <button
            key={station}
            type="button"
            className="ns-tab"
            style={{ ['--tab' as string]: accent }}
            aria-pressed={active}
            aria-keyshortcuts={String(i + 1)}
            aria-label={`${label} station${count ? `, ${count} waiting` : ''}`}
            onClick={() => dispatch({ type: 'selectStation', station })}
          >
            <span>{label}</span>
            <small lang="hi">{hi}</small>
            {count > 0 && <em aria-hidden="true">{count}</em>}
          </button>
        );
      })}
    </Dockable>
  );
}
