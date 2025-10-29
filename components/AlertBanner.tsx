
import React from 'react';
import type { Alert } from '../types';
import { AlertTriangleIcon, SnowflakeIcon } from './icons/Icons';

const AlertIcon: React.FC<{ type: Alert['type'] }> = ({ type }) => {
    switch(type) {
        case 'Heatwave': return <AlertTriangleIcon className="h-6 w-6 text-white" />;
        case 'Frost': return <SnowflakeIcon className="h-6 w-6 text-white" />;
        default: return <AlertTriangleIcon className="h-6 w-6 text-white" />;
    }
}

const alertStyles = {
    Warning: 'bg-yellow-500',
    Critical: 'bg-red-600',
}

const AlertBanner: React.FC<{ alert: Alert }> = ({ alert }) => {
  return (
    <div className={`${alertStyles[alert.severity]} text-white rounded-lg shadow-lg p-4 flex items-start space-x-4`}>
        <div className="flex-shrink-0 pt-0.5">
            <AlertIcon type={alert.type} />
        </div>
        <div>
            <h3 className="font-bold">{alert.title}</h3>
            <p className="text-sm">{alert.message}</p>
        </div>
    </div>
  );
};

export default AlertBanner;
