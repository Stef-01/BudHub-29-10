// Order station: the counter, the customer in front of it, and who is waiting for food.
// Only idle sprites exist (walk/taking-order/reaction states are pending asset work A02), so a
// customer is drawn only while standing still; arriving customers are announced, not animated.
import React from 'react';
import { CustomerSprite } from '../../assets/CustomerSprite.tsx';
import { getSpritePlacement, spriteBoxAtFoot } from '../../assets/anchors.ts';
import { getCatalogCustomer, type GameState } from '../../simulation/index.ts';
import { CounterFront } from '../LayoutStudy.tsx';
import { box, boxAuto } from '../stage.ts';
import { Dockable } from '../Dockable.tsx';
import type { Dispatch } from '../useNutriServeGame.ts';

/** Feet stand behind the counter (counter top y=300); the counter front covers the legs. */
const COUNTER_FOOT_Y = 392;

function Sprite({ catalogId, footX, footY, height, label }: { catalogId: string; footX: number; footY: number; height: number; label?: string }) {
  const placement = getSpritePlacement(catalogId);
  if (!placement) return null;
  const b = spriteBoxAtFoot(placement, footX, footY, height);
  return (
    <div className="ns-sprite" style={box(b.left, b.top, b.width, b.height)}>
      {/* The image is decorative: the text below names the customer (an alt would say it twice). */}
      <CustomerSprite customerId={catalogId} className="ns-sprite-img" decorative />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export function OrderStation({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const queue = state.day.customers.filter((c) => c.phase === 'at_counter').sort((a, b) => (a.atCounterMs ?? 0) - (b.atCounterMs ?? 0));
  const front = queue[0];
  const waiting = state.day.customers.filter((c) => c.phase === 'waiting_food');
  const arriving = state.day.customers.filter((c) => c.phase === 'walking_in');
  const nextArrival = state.day.customers.find((c) => c.phase === 'scheduled');
  const name = (id: string) => getCatalogCustomer(id)?.name ?? id;

  return (
    <>
      {/* Customers queued behind the one at the counter */}
      {queue.slice(1, 3).map((c, i) => (
        <React.Fragment key={c.id}>
          <Sprite catalogId={c.catalogId} footX={120 - i * 55} footY={COUNTER_FOOT_Y - 10} height={215} />
        </React.Fragment>
      ))}
      {front && <Sprite catalogId={front.catalogId} footX={255} footY={COUNTER_FOOT_Y} height={285} label={`${name(front.catalogId)} is at the counter`} />}
      <CounterFront />

      <Dockable slot="main" region={box(150, 340, 220, 80)} className="ns-order-counter">
        {front ? (
          <button type="button" className="ns-btn ns-btn-primary" onClick={() => dispatch({ type: 'takeOrder' })}>
            Take {name(front.catalogId)}'s order
          </button>
        ) : (
          <p className="ns-muted ns-plate">
            {arriving.length > 0
              ? `${arriving.map((c) => name(c.catalogId)).join(', ')} arriving…`
              : nextArrival
                ? `Next customer in ${Math.max(0, Math.ceil((nextArrival.arrivalMs - state.nowMs) / 1000))} s`
                : 'No more customers today'}
          </p>
        )}
      </Dockable>

      {waiting.length > 0 && (
        <Dockable slot="main" as="section" region={boxAuto(8, 40, 230)} className="ns-waiting" aria-label="Waiting for food">
          <h3>Waiting for food</h3>
          <ul>
            {waiting.map((c) => {
              const ticket = state.tickets.find((t) => t.id === c.ticketId);
              return (
                <li key={c.id}>
                  <span className="ns-thumb">
                    <CustomerSprite customerId={c.catalogId} className="ns-sprite-img" decorative />
                  </span>
                  {name(c.catalogId)}
                  {ticket && <small> #{ticket.number}</small>}
                </li>
              );
            })}
          </ul>
        </Dockable>
      )}
    </>
  );
}
