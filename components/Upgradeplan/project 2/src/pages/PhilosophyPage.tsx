import { motion } from 'framer-motion';
import { DrinkingCharacter, TreeCharacter, BlobCharacter } from '../components/CharacterIllustrations';
import { Leaf, Heart, Sparkles, Shield } from 'lucide-react';

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] pt-24">
      <section className="py-20 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-6"
        >
          <h1 className="text-[120px] md:text-[180px] font-black text-[#10B981] text-center leading-none mb-12">
            PHILOSOPHY
          </h1>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <DrinkingCharacter size={400} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-[#E8F5E9] rounded-[40px] p-12 relative"
            >
              <motion.div
                className="absolute -top-6 -left-6"
                animate={{
                  rotate: [0, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <BlobCharacter size={80} color="#FBBF24" />
              </motion.div>

              <p className="text-2xl text-[#1F2937] leading-relaxed font-medium">
                To our cherished customers, we promise one thing: <span className="font-black text-[#10B981]">pure, squeezed fruit juices</span> bursting with natural vitamins and nutrients. We'll only use the freshest fruits and steer clear of cheap concentrates and sneaky additives. Our pledge is to serve up the healthiest ingredients while keeping Mother Earth smiling with minimal environmental impact.
              </p>
            </motion.div>
          </div>

          <div className="relative mb-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex justify-center mb-16"
            >
              <TreeCharacter size={500} />
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { icon: Leaf, title: 'NATURAL', desc: 'No artificial flavors', color: '#84CC16', bg: '#F0FDF4' },
                { icon: Heart, title: 'FRESH', desc: 'Picked at peak ripeness', color: '#F87171', bg: '#FEF2F2' },
                { icon: Sparkles, title: 'SUFFICIENTLY DELICIOUS', desc: 'Bursting with flavor', color: '#FBBF24', bg: '#FFFBEB' },
                { icon: Shield, title: 'EARTH MADE', desc: 'Sustainably sourced', color: '#10B981', bg: '#ECFDF5' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="rounded-[30px] p-8 text-center relative overflow-hidden"
                  style={{ backgroundColor: item.bg }}
                >
                  <motion.div
                    className="absolute -top-10 -right-10 opacity-10"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <item.icon size={120} color={item.color} />
                  </motion.div>

                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center relative z-10"
                    style={{ backgroundColor: item.color }}
                  >
                    <item.icon size={40} color="white" />
                  </div>

                  <h3 className="text-2xl font-black text-[#1F2937] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-lg text-[#4B5563] font-medium">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="bg-[#10B981] rounded-[50px] p-16 text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute top-10 left-10"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BlobCharacter size={100} color="#FBBF24" />
            </motion.div>

            <motion.div
              className="absolute bottom-10 right-10"
              animate={{
                y: [0, 20, 0],
                rotate: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BlobCharacter size={120} color="#F87171" />
            </motion.div>

            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 relative z-10">
              NATURE'S PERFECT SQUEEZE
            </h2>
            <p className="text-3xl text-white/90 font-bold relative z-10">
              Every drop tells a story of sunshine, soil, and sustainability
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
