// components/SwaadCoachCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SwaadCoach from './SwaadCoach';

interface SwaadCoachCardProps {
    className?: string;
}

const SwaadCoachCard: React.FC<SwaadCoachCardProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (isOpen) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={className}
            >
                <SwaadCoach onClose={() => setIsOpen(false)} />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`md:w-64 w-full ${className}`}
        >
            <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-orange-50 via-white to-green-50 border-2 border-orange-200 hover:shadow-xl transition-all">
                <div className="text-center mb-4">
                    <div className="text-4xl mb-2">💬</div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-1">
                        Chat with SWAAD Coach
                    </h3>
                    <p className="text-xs text-gray-600">
                        Get personalized nutrition advice
                    </p>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <span>Start Chatting</span>
                    <span className="text-lg">→</span>
                </button>
            </div>
        </motion.div>
    );
};

export default SwaadCoachCard;
