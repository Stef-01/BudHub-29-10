// Prep station: four independent slots. Progress is in provisional prep units (prep-v1).
import React from 'react';
import { PREP_V1, prepTargetUnits, type Command, type CommandResult, type Dish, type GameState } from '../../simulation/index.ts';
import { HoldButton } from '../HoldButton.tsx';
import { box } from '../stage.ts';
import { Dockable } from '../Dockable.tsx';
import { foodLabel } from '../TicketRail.tsx';

const LEVELS = [
  { id: 'quick', short: 'Quick' },
  { id: 'regular', short: 'Simmer' },
  { id: 'slow', short: 'Slow' },
] as const;

function dishName(dish: Dish): string {
  const main = dish.build.main?.foodId ?? dish.build.base?.foodId;
  return `${dish.size} · ${main ? foodLabel(main) : 'empty'}`;
}

export function PrepStation({ state, dispatch }: { state: GameState; dispatch: (c: Command) => CommandResult }) {
  const built = state.dishes.filter((d) => d.stage === 'built');
  const ticket = state.tickets.find((t) => t.id === state.selected.ticketId && t.servedAtMs === undefined);
  const wanted = ticket ? prepTargetUnits(ticket.order.prepLevel) : undefined;
  const wantedLevel = ticket ? LEVELS.find((l) => l.id === ticket.order.prepLevel) : undefined;
  const freeSlot = state.prepSlots.findIndex((s) => !s.dishId);

  return (
    <>
      <Dockable slot="main" region={box(10, 44, 470, 300)} className="ns-prep-slots">
        {state.prepSlots.map((slot) => {
          const dish = state.dishes.find((d) => d.id === slot.dishId);
          const units = dish?.prep ? Math.floor(dish.prep.milliUnits / 1000) : 0;
          const heatPct = Math.round((slot.heat / PREP_V1.heatMax) * 100);
          return (
            <section key={slot.index} className={`ns-prep-unit${slot.overheated ? ' ns-overheated' : ''}`} aria-label={`Prep slot ${slot.index + 1}`}>
              <h3>{slot.index + 1}</h3>
              {dish ? (
                <>
                  <p className="ns-prep-dish">{dishName(dish)}</p>
                  <div
                    className="ns-prep-bar"
                    role="meter"
                    aria-label={`Slot ${slot.index + 1} progress`}
                    aria-valuemin={0}
                    aria-valuemax={PREP_V1.maxUnits}
                    aria-valuenow={units}
                    aria-valuetext={`${units} prep units${wanted ? `, ticket wants ${wanted}` : ''}`}
                  >
                    <span className="ns-prep-fill" style={{ width: `${(units / PREP_V1.maxUnits) * 100}%` }} />
                    {LEVELS.map((level) => {
                      const target = prepTargetUnits(level.id);
                      return (
                        <span
                          key={level.id}
                          className={`ns-prep-mark${wanted === target ? ' ns-wanted' : ''}`}
                          style={{ left: `${(target / PREP_V1.maxUnits) * 100}%` }}
                          title={level.short}
                        />
                      );
                    })}
                  </div>
                  <p className="ns-prep-target">
                    {wantedLevel ? (
                      <>
                        Target <b>{wantedLevel.short}</b>
                      </>
                    ) : (
                      'Marks: quick · simmer · slow'
                    )}
                  </p>
                  <div className="ns-heat" role="meter" aria-label={`Slot ${slot.index + 1} heat`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={heatPct}>
                    <span style={{ width: `${heatPct}%` }} />
                  </div>
                  <p className="ns-muted">{slot.overheated ? 'Too hot! Boost locked' : wanted ? `${units} / ${wanted}` : `${units} units`}</p>
                  <HoldButton
                    className="ns-btn ns-btn-boost"
                    disabled={slot.overheated}
                    active={slot.boostHeld && !slot.overheated}
                    aria-label={`Hold to boost slot ${slot.index + 1}`}
                    onStart={() => dispatch({ type: 'setBoost', slot: slot.index, held: true })}
                    onEnd={() => dispatch({ type: 'setBoost', slot: slot.index, held: false })}
                  >
                    Boost
                  </HoldButton>
                  <button type="button" className="ns-btn ns-btn-primary" onClick={() => dispatch({ type: 'finishPrep', slot: slot.index })}>
                    Done
                  </button>
                </>
              ) : (
                <>
                  <p className="ns-muted">Empty</p>
                  {built.length > 0 && (
                    <button type="button" className="ns-btn" onClick={() => dispatch({ type: 'startPrep', dishId: built[0].id, slot: slot.index })}>
                      Load {dishName(built[0])}
                    </button>
                  )}
                </>
              )}
            </section>
          );
        })}
      </Dockable>
      <Dockable slot="main" region={box(10, 350, 470, 76)} className="ns-tray" aria-label="Built dishes waiting for prep">
        <span className="ns-tray-label">Ready to prep:</span>
        {built.length === 0 && <span className="ns-muted">nothing yet</span>}
        {built.map((dish) => (
          <button
            key={dish.id}
            type="button"
            className="ns-btn"
            disabled={freeSlot < 0}
            onClick={() => dispatch({ type: 'startPrep', dishId: dish.id, slot: freeSlot })}
          >
            {dishName(dish)}
          </button>
        ))}
        <span className="ns-provisional" title="Prep timing uses provisional parameters (prep-v1), pending reference evidence Q08">
          provisional timing
        </span>
      </Dockable>
    </>
  );
}
