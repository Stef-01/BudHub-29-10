// components/games/nutriserve-ui/DidYouKnowCard.tsx
import React, { useState, useMemo } from 'react';
import { IconInfoCircle } from './Icons';
import { DID_YOU_KNOW_TIPS } from '../../../services/nutriserveFoodData';

const DidYouKnowCard: React.FC = () => {
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * DID_YOU_KNOW_TIPS.length));

    const currentTip = useMemo(() => DID_YOU_KNOW_TIPS[tipIndex], [tipIndex]);
    
    // This is simple, for a real app you might want to avoid showing the same tip twice in a row.
    const showAnotherTip = () => {
        setTipIndex(Math.floor(Math.random() * DID_YOU_KNOW_TIPS.length));
    };

    return (
        <div 
            className="p-4 bg-sky-50 border border-sky-200 rounded-lg cursor-pointer"
            onClick={showAnotherTip}
            title="Click for another tip"
        >
            <div className="flex items-start gap-3">
                <IconInfoCircle className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-sky-800">Did you know?</h4>
                    <p className="text-sm text-sky-700 mt-1">{currentTip}</p>
                </div>
            </div>
        </div>
    );
};

export default DidYouKnowCard;
