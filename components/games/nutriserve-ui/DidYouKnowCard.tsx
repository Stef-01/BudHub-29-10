// components/games/nutriserve-ui/DidYouKnowCard.tsx
import React, { useState, useMemo } from 'react';
import { DID_YOU_KNOW_TIPS } from '../../../services/nutriServeFoodData';
import { IconInfoCircle, IconArrowRightCircle } from './Icons';

const DidYouKnowCard: React.FC = () => {
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * DID_YOU_KNOW_TIPS.length));

    const nextTip = () => {
        setTipIndex(prev => (prev + 1) % DID_YOU_KNOW_TIPS.length);
    };

    const currentTip = useMemo(() => DID_YOU_KNOW_TIPS[tipIndex], [tipIndex]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
                <IconInfoCircle className="w-8 h-8 text-sky-500 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Did You Know?</h3>
                    <p className="text-sm text-slate-600 mt-2">
                        {currentTip}
                    </p>
                </div>
            </div>
             <button
                onClick={nextTip}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
                Next Tip
                <IconArrowRightCircle className="ml-2 h-5 w-5"/>
            </button>
        </div>
    );
};

export default DidYouKnowCard;
