// components/SwaadCoach.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { swaadCoachService, CoachMessage } from '../services/swaadCoachService';
import { useSwaadCoachContext } from '../hooks/useSwaadCoachContext';
import { useUserCookbook } from '../contexts/UserCookbookContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface SwaadCoachProps {
    onClose?: () => void;
}

const SwaadCoach: React.FC<SwaadCoachProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "G'day! 🙏 I'm your SWAAD Coach. I'm here to help you make small, realistic changes to help you get to your best self. What's on your mind today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userContext = useSwaadCoachContext();
    const { recipes } = useUserCookbook();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Convert internal message format to Gemini format
            const history: CoachMessage[] = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            const responseText = await swaadCoachService.getResponse(
                textToSend,
                history,
                userContext,
                recipes
            );

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error getting response:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Maaf kijiye (Forgive me) 🙏, I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const quickActions = [
        { label: "Discuss my learning", emoji: "📊" },
        { label: "I'm craving...", emoji: "🤤" },
        { label: "Healthier version of...", emoji: "🥗" },
        { label: "What should I eat?", emoji: "🍽️" },
    ];

    // Floating Widget UI
    if (isMinimized) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-6 right-6 z-50 cursor-pointer group"
                onClick={() => setIsMinimized(false)}
            >
                <div className="bg-gradient-to-r from-orange-500 to-green-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform border-2 border-white">
                    <span className="text-3xl">💬</span>
                </div>
                <div className="absolute bottom-full right-0 mb-2 bg-white px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-bold text-slate-700 pointer-events-none">
                    Chat with SWAAD Coach
                </div>
            </motion.div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="glass-card rounded-2xl bg-white border-2 border-orange-200 shadow-2xl overflow-hidden flex flex-col pointer-events-auto w-full max-w-md h-[600px] max-h-[80vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-green-500 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <span className="text-2xl">👳🏽‍♂️</span>
                        </div>
                        <div>
                            <h3 className="font-display text-lg font-bold text-white leading-none">SWAAD Coach</h3>
                            <p className="text-xs text-orange-50 font-medium mt-1 opacity-90">Your dietary companion</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                            title="Minimize"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                                title="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    <AnimatePresence>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    <p className={`text-[10px] mt-1.5 font-medium ${message.role === 'user' ? 'text-orange-100' : 'text-slate-400'}`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                <div className="flex gap-1.5">
                                    <motion.div
                                        className="w-2 h-2 bg-green-500 rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 bg-green-500 rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 bg-green-500 rounded-full"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length === 1 && (
                    <div className="px-4 py-3 flex gap-2 flex-wrap border-t border-slate-100 bg-white shrink-0">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => {
                                    setInput(action.label);
                                }}
                                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-100 px-3 py-1.5 rounded-full transition-all font-semibold flex items-center gap-1.5"
                            >
                                <span>{action.emoji}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm text-slate-700 placeholder-slate-400"
                            disabled={isTyping}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-2.5 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center aspect-square"
                        >
                            <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SwaadCoach;
