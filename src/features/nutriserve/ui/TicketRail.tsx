// Ticket rail (top) and the selected paper ticket (right). Tickets are code-native UI text.
import React from 'react';
import { DRIZZLES, GARNISHES } from '../data/finishItems.ts';
import { getCatalogCustomer, getFood, type GameState, type Ticket } from '../simulation/index.ts';
import type { Dispatch } from './useNutriServeGame.ts';
import { box } from './stage.ts';
import { Dockable } from './Dockable.tsx';

const SIZE_LABEL = { small: 'SMALL', medium: 'MEDIUM', large: 'LARGE' } as const;
const PREP_LABEL = { quick: 'QUICK SIMMER', regular: 'SIMMER', slow: 'SLOW COOK' } as const;

export function foodLabel(id: string): string {
  return getFood(id)?.label ?? id;
}

export function customerName(ticket: Ticket): string {
  return getCatalogCustomer(ticket.catalogCustomerId)?.name ?? ticket.catalogCustomerId;
}

export function TicketDetails({ ticket }: { ticket: Ticket }) {
  const o = ticket.order;
  return (
    <>
      <span className="ns-ticket-number">#{ticket.number}</span>
      <b>{customerName(ticket)}</b>
      <hr />
      <span>{SIZE_LABEL[o.size]}</span>
      <ul className="ns-ticket-foods" aria-label="Foods">
        <li>{foodLabel(o.baseId)}</li>
        <li>{foodLabel(o.mainId)}</li>
        <li>{foodLabel(o.sideId)}</li>
      </ul>
      <hr />
      <span>{PREP_LABEL[o.prepLevel]}</span>
      <hr />
      <ol className="ns-ticket-finish">
        {o.finish.length === 0 && <li>No finish</li>}
        {o.finish.map((step, i) => (
          <li key={i}>
            {step.kind === 'drizzle' ? DRIZZLES[step.id]?.label ?? step.id : `${GARNISHES[step.id]?.label ?? step.id} ×${step.count}`}
          </li>
        ))}
      </ol>
    </>
  );
}

export function TicketRail({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const open = state.tickets.filter((t) => t.servedAtMs === undefined);
  const selected = open.find((t) => t.id === state.selected.ticketId) ?? open[0];
  return (
    <>
      <Dockable slot="top" region={box(0, 0, 470, 34)} className="ns-rail" role="toolbar" aria-label="Order tickets">
        {open.length === 0 && <span className="ns-rail-empty">No open tickets</span>}
        {open.map((t) => (
          <button
            key={t.id}
            type="button"
            className="ns-rail-ticket"
            aria-pressed={t.id === selected?.id}
            onClick={() => dispatch({ type: 'selectTicket', ticketId: t.id })}
          >
            #{t.number} {customerName(t)}
          </button>
        ))}
      </Dockable>
      {selected && (
        <Dockable slot="top" as="aside" region={box(486, 8, 146, 336)} className="ns-ticket" aria-label={`Ticket ${selected.number}`}>
          <TicketDetails ticket={selected} />
        </Dockable>
      )}
    </>
  );
}
