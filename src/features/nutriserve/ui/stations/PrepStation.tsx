// Prep station: four independent slots. Progress is in ms on the flame at normal heat (PREP_V1, prep-v4).
import React, { useRef } from 'react';
import { PREP_V1, prepSeconds, prepTargetUnits, type Dish, type GameState } from '../../simulation/index.ts';
import { HoldButton } from '../HoldButton.tsx';
import { box } from '../stage.ts';
import { Dockable } from '../Dockable.tsx';
import { dishLabel, dishTicket } from '../TicketRail.tsx';
import { slotsAtMark } from '../StationTabs.tsx';
import type { Dispatch } from '../useNutriServeGame.ts';

const LEVELS = [
  { id: 'quick', short: 'Quick' },
  { id: 'regular', short: 'Simmer' },
  { id: 'slow', short: 'Slow' },
] as const;

export function PrepStation({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const built = state.dishes.filter((d) => d.stage === 'built');
  const freeSlot = state.prepSlots.findIndex((s) => !s.dishId);
  const atMark = slotsAtMark(state);
  const dishName = (dish: Dish) => dishLabel(state, dish);
  // Whether a slot's boost was latched before the current press (a tap toggles the latch).
  const latchedBefore = useRef<boolean[]>([]);

  return (
    <>
      <Dockable slot="main" region={box(10, 44, 470, 300)} className="ns-prep-slots">
        {state.prepSlots.map((slot) => {
          const dish = state.dishes.find((d) => d.id === slot.dishId);
          // Each slot is guided by its own dish's ticket, not by the rail selection.
          const ticket = dishTicket(state, dish);
          const wanted = ticket ? prepTargetUnits(ticket.order.prepLevel) : undefined;
          const wantedLevel = ticket ? LEVELS.find((l) => l.id === ticket.order.prepLevel) : undefined;
          const units = dish?.prep ? Math.floor(dish.prep.milliUnits / 1000) : 0;
          const heatPct = Math.round((slot.heat / PREP_V1.heatMax) * 100);
          return (
            <section
              key={slot.index}
              className={`ns-prep-unit${dish ? '' : ' ns-prep-empty'}${slot.overheated ? ' ns-overheated' : ''}${atMark.includes(slot.index) ? ' ns-at-mark' : ''}`}
              aria-label={`Prep slot ${slot.index + 1}`}
            >
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
                    aria-valuetext={`${prepSeconds(units)} seconds on the flame${wanted ? `, ticket wants ${prepSeconds(wanted)}` : ''}`}
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
                    {wantedLevel && ticket ? (
                      <>
                        #{ticket.number} wants <b>{wantedLevel.short}</b>
                      </>
                    ) : (
                      'Marks: quick · simmer · slow'
                    )}
                  </p>
                  <div
                    className="ns-heat"
                    role="meter"
                    aria-label={`Slot ${slot.index + 1} heat`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={heatPct}
                  >
                    <span style={{ width: `${heatPct}%` }} />
                  </div>
                  <p className="ns-muted">
                    {slot.overheated ? 'Too hot! Off the flame' : wanted ? `${prepSeconds(units).toFixed(1)} / ${prepSeconds(wanted)} s` : `${prepSeconds(units).toFixed(1)} s`}
                    {atMark.includes(slot.index) && <b className="ns-take-out"> Take it out!</b>}
                  </p>
                  <HoldButton
                    className="ns-btn ns-btn-boost"
                    disabled={slot.overheated}
                    active={slot.boostHeld && !slot.overheated}
                    aria-label={`Hold to boost slot ${slot.index + 1}`}
                    aria-describedby="ns-boost-hint"
                    onStart={() => {
                      latchedBefore.current[slot.index] = slot.boostHeld;
                      dispatch({ type: 'setBoost', slot: slot.index, held: true });
                    }}
                    // A hold boosts while held; a quick tap latches the boost on (or off again).
                    onEnd={(short) =>
                      dispatch({ type: 'setBoost', slot: slot.index, held: short ? !latchedBefore.current[slot.index] : false }, { silent: true })
                    }
                    // A touch hold that turned into a scroll puts the boost back how it was.
                    onCancel={() => dispatch({ type: 'setBoost', slot: slot.index, held: !!latchedBefore.current[slot.index] }, { silent: true })}
                    onTap={() => dispatch({ type: 'setBoost', slot: slot.index, held: !slot.boostHeld })}
                  >
                    Boost
                  </HoldButton>
                  <button
                    type="button"
                    className="ns-btn ns-btn-primary"
                    data-prep-done={slot.index}
                    onClick={() => dispatch({ type: 'finishPrep', slot: slot.index })}
                  >
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
      <span id="ns-boost-hint" className="sr-only">
        Hold to boost; a tap turns the boost on until you tap again or the handi overheats.
      </span>
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
        <span className="ns-provisional" title={`Prep timing uses provisional rules (${PREP_V1.version}) that may change`}>
          provisional timing
        </span>
      </Dockable>
    </>
  );
}
