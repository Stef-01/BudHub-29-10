
import React from 'react';
import type { CommunityEvent } from '../types';
import { CommunityIcon } from './icons/Icons';

interface EventCardProps {
  event: CommunityEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 flex items-start space-x-4">
      <div className="flex-shrink-0 pt-1">
        <div className="bg-green-100 p-3 rounded-full">
            <CommunityIcon className="h-6 w-6 text-green-700" />
        </div>
      </div>
      <div>
        <h4 className="font-bold text-gray-800">{event.name}</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
            <p className="font-semibold">{event.date}</p>
            <p>{event.location}</p>
        </div>
        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
      </div>
    </div>
  );
};

export default EventCard;
