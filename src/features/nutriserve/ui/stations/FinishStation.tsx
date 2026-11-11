// Finish station: drizzle (hold on the vessel) and garnish (tap to place), then serve.
// Pointer, touch and keyboard all drive the same simulation commands:
//   pointer/touch: press + drag on the vessel to drizzle; tap to place the selected garnish
//   keyboard:      arrows move the cursor, Space (hold) drizzles, Enter places a garnish
import React, { useRef, useState } from 'react';
import { DRIZZLES, GARNISHES } from '../../data/finishItems.ts';
import { dishMatchesOrder, type Command, type CommandResult, type Dish, type GameState } from '../../simulation/index.ts';
import { DRIZZLE_COLORS, foodColor, GarnishGlyph, VesselTop } from '../LayoutStudy.tsx';
import { box, clientToLocal } from '../stage.ts';
import { Dockable } from '../Dockable.tsx';
import { customerName, foodLabel } from '../TicketRail.tsx';

type Tool = { kind: 'drizzle'; id: string } | { kind: 'garnish'; id: string };

function dishName(dish: Dish): string {
  const main = dish.build.main?.foodId ?? dish.build.base?.foodId;
  return `${dish.size} · ${main ? foodLabel(main) : 'empty'}`;
}

export function FinishStation({ state, dispatch }: { state: GameState; dispatch: (c: Command) => CommandResult }) {
  const working = state.dishes.filter((d) => d.stage === 'prepped' || d.stage === 'finishing');
  const ready = state.dishes.filter((d) => d.stage === 'ready');
  const open = state.tickets.filter((t) => t.servedAtMs === undefined);
  const selectedId = state.selected.dishId;
  const dish = working.find((d) => d.id === selectedId) ?? working[0];
  const readySelected = ready.find((d) => d.id === selectedId) ?? ready[0];
  const rank = state.profile.rank;
  const drizzles = Object.values(DRIZZLES).filter((d) => d.unlockRank <= rank);
  const garnishes = Object.values(GARNISHES).filter((g) => g.unlockRank <= rank);
  const [tool, setTool] = useState<Tool>({ kind: 'drizzle', id: drizzles[0]?.id ?? 'curd_swirl' });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const vesselRef = useRef<HTMLDivElement>(null);
  const drizzling = state.held?.kind === 'drizzle';

  const local = (e: React.PointerEvent) => clientToLocal(vesselRef.current!.getBoundingClientRect(), e.clientX, e.clientY);

  const startAt = (p: { x: number; y: number }) => {
    if (!dish) return;
    if (tool.kind === 'drizzle') dispatch({ type: 'beginDrizzle', dishId: dish.id, drizzleId: tool.id, x: p.x, y: p.y });
    else dispatch({ type: 'placeGarnish', dishId: dish.id, garnishId: tool.id, x: p.x, y: p.y });
  };
  const stop = () => {
    if (state.held?.kind === 'drizzle') dispatch({ type: 'endDrizzle' });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.25 : 0.1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const next = { x: Math.max(-1.2, Math.min(1.2, cursor.x + moves[e.key][0])), y: Math.max(-1.2, Math.min(1.2, cursor.y + moves[e.key][1])) };
      setCursor(next);
      if (drizzling) dispatch({ type: 'moveDrizzle', x: next.x, y: next.y });
    } else if (e.key === ' ' && tool.kind === 'drizzle' && !e.repeat) {
      e.preventDefault();
      startAt(cursor);
    } else if (e.key === 'Enter' && tool.kind === 'garnish') {
      e.preventDefault();
      startAt(cursor);
    }
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      stop();
    }
  };

  return (
    <>
      <Dockable slot="main" as="aside" region={box(8, 40, 148, 384)} className="ns-tray ns-tray-column" aria-label="Dishes at the finish counter">
        <span className="ns-tray-label">To finish</span>
        {working.length === 0 && <span className="ns-muted">Prep a dish first</span>}
        {working.map((d) => (
          <button key={d.id} type="button" className="ns-btn" aria-pressed={d.id === dish?.id} onClick={() => dispatch({ type: 'selectDish', dishId: d.id })}>
            {dishName(d)}
          </button>
        ))}
        <span className="ns-tray-label">Ready</span>
        {ready.length === 0 && <span className="ns-muted">none</span>}
        {ready.map((d) => (
          <button key={d.id} type="button" className="ns-btn" aria-pressed={d.id === readySelected?.id} onClick={() => dispatch({ type: 'selectDish', dishId: d.id })}>
            {dishName(d)}
          </button>
        ))}
        {readySelected && (
          <div className="ns-serve">
            <span className="ns-tray-label">Serve {dishName(readySelected)} to</span>
            {open.length === 0 && <span className="ns-muted">no open tickets</span>}
            {open.map((t) => {
              const matches = dishMatchesOrder(readySelected, t.order);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`ns-btn ${matches ? 'ns-btn-primary' : 'ns-btn-warn'}`}
                  onClick={() => dispatch({ type: 'serve', dishId: readySelected.id, ticketId: t.id })}
                >
                  #{t.number} {customerName(t)}
                  {!matches && <small> (doesn't match)</small>}
                </button>
              );
            })}
          </div>
        )}
      </Dockable>

      {dish ? (
        <>
          <Dockable
            slot="main"
            region={box(164, 44, 268, 268)}
            ref={vesselRef}
            className="ns-vessel-top"
            tabIndex={0}
            role="application"
            aria-label={`Finish ${dishName(dish)}. Arrow keys move the cursor; hold Space to drizzle, Enter to place a garnish.`}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = local(e);
              setCursor(p);
              startAt(p);
            }}
            onPointerMove={(e) => {
              if (!drizzling) return;
              const p = local(e);
              setCursor(p);
              dispatch({ type: 'moveDrizzle', x: p.x, y: p.y });
            }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onLostPointerCapture={stop}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={stop}
          >
            <VesselTop
              label="Vessel seen from above"
              baseColor={foodColor(dish.build.base?.foodId)}
              mainColor={foodColor(dish.build.main?.foodId)}
              drizzles={Object.entries(dish.finish.drizzles).map(([id, d]) => ({ color: DRIZZLE_COLORS[id] ?? '#fff', cellsMg: d.cellsMg }))}
              garnishes={dish.finish.garnishes}
              cursor={cursor}
            />
          </Dockable>
          <Dockable slot="main" region={box(164, 318, 316, 70)} className="ns-tools" role="toolbar" aria-label="Finish tools">
            {drizzles.map((d) => (
              <button key={d.id} type="button" className="ns-tool" aria-pressed={tool.kind === 'drizzle' && tool.id === d.id} onClick={() => setTool({ kind: 'drizzle', id: d.id })}>
                <i style={{ background: DRIZZLE_COLORS[d.id] }} aria-hidden="true" />
                {d.label}
              </button>
            ))}
            {garnishes.map((g) => (
              <button key={g.id} type="button" className="ns-tool" aria-pressed={tool.kind === 'garnish' && tool.id === g.id} onClick={() => setTool({ kind: 'garnish', id: g.id })}>
                <svg viewBox="-12 -12 24 24" aria-hidden="true">
                  <GarnishGlyph id={g.id} />
                </svg>
                {g.label}
              </button>
            ))}
          </Dockable>
          <Dockable slot="main" region={box(164, 392, 316, 40)} className="ns-row ns-actions">
            <button type="button" className="ns-btn ns-btn-primary" disabled={drizzling} onClick={() => dispatch({ type: 'finishDish', dishId: dish.id })}>
              Done
            </button>
            <button type="button" className="ns-btn ns-btn-quiet" disabled={drizzling} onClick={() => dispatch({ type: 'trash', dishId: dish.id })}>
              Trash
            </button>
            <span className="ns-provisional" title="Finish grading uses provisional rules (finish-v1), pending reference evidence Q09">
              provisional grading
            </span>
          </Dockable>
        </>
      ) : (
        <Dockable slot="main" as="p" region={box(164, 160, 316, 60)} className="ns-muted ns-center">
          {ready.length > 0 ? 'Serve a ready dish from the list.' : 'Nothing to finish yet.'}
        </Dockable>
      )}
    </>
  );
}
