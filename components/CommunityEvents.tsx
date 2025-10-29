
import React from 'react';
import type { CommunityEvent } from '../types';
import EventCard from './EventCard';

interface CommunityEventsProps {
  events: CommunityEvent[];
}

const CommunityEvents: React.FC<CommunityEventsProps> = ({ events }) => {
  return (
    <div>
        <h2 className="text-2xl font-bold text-green-900 mb-6">Community Events</h2>
        <div className="space-y-4">
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    </div>
  );
};

export default CommunityEvents;
