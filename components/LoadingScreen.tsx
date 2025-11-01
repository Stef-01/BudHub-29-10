// components/LoadingScreen.tsx
import React from 'react';
import { LoadingSpinner } from './icons/Icons';

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading your garden vibe..." }) => (
    <div className="fixed inset-0 bg-green-50 z-50 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-green-800 mb-4">Garden<span className="text-green-500">Vibe</span></h1>
        <LoadingSpinner className="h-10 w-10 text-green-600" />
        <p className="text-gray-600 mt-4">{message}</p>
    </div>
);

export default LoadingScreen;
