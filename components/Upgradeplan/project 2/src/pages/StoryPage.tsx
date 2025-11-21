import { motion } from 'framer-motion';
import { TruckCharacter, FarmerCharacter, BlobCharacter } from '../components/CharacterIllustrations';
import { Calendar, MapPin, Users, Award } from 'lucide-react';

const timeline = [
  {
    year: '2018',
    title: 'The Beginning',
    description: 'Started with a simple dream: bring fresh, honest juice to families everywhere',
    icon: MapPin,
    color: '#FBBF24',
  },
  {
    year: '2019',
    title: 'First Farm Partnership',
    description: 'Partnered with sustainable farms in Tien Giang, Vietnam',
    icon: Users,
    color: '#10B981',
  },
  {
    year: '2020',
    title: 'Certified Organic',
    description: 'Achieved Rainforest Alliance certification for our practices',
    icon: Award,
    color: '#8B5CF6',
  },
  {
    year: '2022',
    title: 'National Expansion',
    description: 'Now delivering fresh juice to 500+ cities nationwide',
    icon: Calendar,
    color: '#F87171',
  },
];

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] pt-24">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="text-[120px] md:text-[180px] font-black text-[#10B981] leading-none mb-6">
              OUR STORY
            </h1>
            <p className="text-3xl text-[#4B5563] font-bold max-w-4xl mx-auto">
              From a small farm dream to your kitchen table
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-32 flex justify-center"
          >
            <FarmerCharacter size={400} />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#FEF3C7] rounded-[50px] p-12 relative overflow-hidden"
            >
              <motion.div
                className="absolute -top-8 -right-8"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <BlobCharacter size={120} color="#FBBF24" />
              </motion.div>

              <h2 className="text-5xl font-black text-[#1F2937] mb-6 relative z-10">
                It started with a question...
              </h2>
              <p className="text-2xl text-[#4B5563] leading-relaxed font-medium relative z-10">
                "Why can't juice just be... juice?" No concentrates. No artificial flavors. Just pure fruit, squeezed fresh, like nature intended. That simple question sparked a revolution in how we think about what we drink.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TruckCharacter size={600} />
            </motion.div>
          </div>

          <div className="mb-32">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-6xl md:text-7xl font-black text-center text-[#1F2937] mb-20"
            >
              OUR JOURNEY
            </motion.h2>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[#10B981] opacity-20" />

              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`flex items-center gap-8 mb-16 ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white rounded-[40px] p-8 shadow-xl inline-block"
                    >
                      <div className="flex items-center gap-4 mb-4"
                           style={{ flexDirection: index % 2 === 0 ? 'row-reverse' : 'row' }}>
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: item.color }}
                        >
                          <item.icon size={32} color="white" />
                        </div>
                        <span className="text-5xl font-black" style={{ color: item.color }}>
                          {item.year}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-[#1F2937] mb-3">
                        {item.title}
                      </h3>
                      <p className="text-xl text-[#6B7280] font-medium">
                        {item.description}
                      </p>
                    </motion.div>
                  </div>

                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5,
                    }}
                    className="w-8 h-8 rounded-full z-10"
                    style={{ backgroundColor: item.color }}
                  />

                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-[50px] p-16 text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute top-10 left-10"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 5,
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
                rotate: [0, -15, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BlobCharacter size={120} color="#F87171" />
            </motion.div>

            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 relative z-10">
              THIS IS JUST THE BEGINNING
            </h2>
            <p className="text-3xl text-white/90 font-bold relative z-10">
              Join us on our mission to make fresh, honest juice accessible to everyone
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
