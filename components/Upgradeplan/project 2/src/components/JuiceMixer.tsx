import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Zap, Sparkles } from 'lucide-react';

export default function JuiceMixer() {
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);

  useEffect(() => {
    if (isMixing) {
      const interval = setInterval(() => {
        setMixProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsMixing(false);
              setMixProgress(0);
            }, 1000);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isMixing]);

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6">
            THE MIXING PROCESS
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            Watch how we blend fresh fruits into perfect juice
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-cream to-white rounded-3xl p-12 shadow-2xl relative overflow-hidden"
          >
            <svg
              width="100%"
              height="500"
              viewBox="0 0 600 500"
              className="mx-auto"
            >
              <defs>
                <linearGradient id="blenderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" />
                  <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>
                <linearGradient id="juiceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="50%" stopColor="#FB923C" />
                  <stop offset="100%" stopColor="#FDBA74" />
                </linearGradient>
              </defs>

              <motion.rect
                x="200"
                y="100"
                width="200"
                height="300"
                rx="20"
                fill="url(#blenderGradient)"
                stroke="#0EA5E9"
                strokeWidth="4"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              />

              <motion.rect
                x="210"
                y={isMixing ? 200 + (100 - mixProgress) : 300}
                width="180"
                height={isMixing ? mixProgress * 2 : 100}
                rx="10"
                fill="url(#juiceGradient)"
                animate={{
                  opacity: isMixing ? [0.8, 1, 0.8] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isMixing ? Infinity : 0,
                }}
              />

              {isMixing && [...Array(20)].map((_, i) => (
                <motion.circle
                  key={i}
                  cx={250 + Math.random() * 100}
                  cy={300 + Math.random() * 80}
                  r={3 + Math.random() * 5}
                  fill="#FED7AA"
                  initial={{ opacity: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [0, -60, -120],
                    x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                  }}
                />
              ))}

              <motion.circle
                cx="300"
                cy="150"
                r="40"
                fill="none"
                stroke="#F97316"
                strokeWidth="3"
                initial={{ scale: 0, opacity: 0 }}
                animate={isMixing ? {
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                } : { scale: 0, opacity: 0 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />

              {[...Array(8)].map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                const x = 300 + Math.cos(angle) * 60;
                const y = isMixing ? 250 : 350;

                return (
                  <motion.circle
                    key={`fruit-${i}`}
                    cx={x}
                    cy={y}
                    r="15"
                    fill={['#EF4444', '#F97316', '#FBBF24', '#84CC16', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'][i]}
                    initial={{ y: 100 }}
                    animate={{
                      y: isMixing ? 350 : y,
                      opacity: isMixing ? [1, 0] : 1,
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1,
                    }}
                  />
                );
              })}

              <motion.path
                d="M240 420 L240 440 L360 440 L360 420"
                stroke="#64748B"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />

              <motion.rect
                x="260"
                y="430"
                width="80"
                height="20"
                rx="10"
                fill="#10B981"
                animate={isMixing ? {
                  fill: ['#10B981', '#EF4444', '#10B981'],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isMixing ? Infinity : 0,
                }}
              />
            </svg>

            {isMixing && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <div className="absolute inset-0 bg-primary" style={{ mixBlendMode: 'overlay' }} />
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.button
              onClick={() => setIsMixing(true)}
              disabled={isMixing}
              whileHover={!isMixing ? { scale: 1.05 } : {}}
              whileTap={!isMixing ? { scale: 0.98 } : {}}
              className={`px-12 py-5 rounded-full font-black text-xl shadow-lg transition-all ${
                isMixing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {isMixing ? (
                <span className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap size={24} />
                  </motion.div>
                  Blending... {mixProgress}%
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Sparkles size={24} />
                  Start Blending
                </span>
              )}
            </motion.button>

            {mixProgress === 100 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-2xl font-black text-primary"
              >
                Perfect Blend Ready!
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
