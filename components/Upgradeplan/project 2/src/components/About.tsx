import { motion } from 'framer-motion';
import { MapPin, Sprout, Award } from 'lucide-react';
import { LeafShape, BlobShape } from './DecorativeShapes';
import { Kiwi, Blueberry, GrapeCluster } from './AdvancedFruitIllustrations';
import { FloatingFruit, RotatingFruit } from './AnimatedFruitWrappers';
import { LiquidWave } from './AnimatedSplashEffects';

export default function About() {
  const stats = [
    { value: '283g', label: 'Fresh Fruit Per Bottle' },
    { value: '100%', label: 'Natural Ingredients' },
    { value: '0g', label: 'Added Sugar' },
    { value: '37mg', label: 'Vitamin C Per Serving' },
  ];

  return (
    <section id="about" className="py-32 bg-white relative overflow-hidden">
      <FloatingFruit delay={0} className="absolute top-40 right-20 opacity-20 z-0">
        <Kiwi size={180} />
      </FloatingFruit>

      <RotatingFruit delay={0.5} className="absolute bottom-20 left-10 opacity-20 z-0">
        <Blueberry size={160} />
      </RotatingFruit>

      <FloatingFruit delay={1} className="absolute top-20 left-[15%] opacity-15 z-0">
        <GrapeCluster size={140} />
      </FloatingFruit>

      <motion.div
        className="absolute bottom-0 left-0 right-0 opacity-10 z-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.1 }}
        viewport={{ once: true }}
      >
        <LiquidWave size={400} />
      </motion.div>

      <motion.div
        className="absolute top-40 right-20 opacity-10"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <LeafShape size={250} />
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-10 opacity-10"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <BlobShape size={300} color="#F97316" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6">
            OUR STORY
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            From farm to bottle, every drop tells a story of quality and sustainability.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-full" />
              <div className="relative bg-cream rounded-3xl p-12 shadow-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-white" size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">
                      Sourced Sustainably
                    </h3>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      Our fruits come from eco-friendly farms in <span className="font-bold text-primary">Tien Giang province, Vietnam</span>,
                      certified by Rainforest Alliance for sustainable farming practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full" />
              <div className="relative bg-cream rounded-3xl p-12 shadow-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Sprout className="text-white" size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">
                      Chemical-Free
                    </h3>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      <span className="font-bold text-primary">Zero pesticides, zero chemicals.</span> Just pure fruit juice
                      squeezed fresh, with only a pinch of cane sugar to enhance the natural flavors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 md:p-16 text-white shadow-2xl"
        >
          <div className="text-center mb-12">
            <Award className="inline-block mb-4" size={48} />
            <h3 className="text-4xl md:text-5xl font-black mb-4">
              Quality You Can Trust
            </h3>
            <p className="text-xl opacity-90">
              Every bottle meets the highest international standards
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base opacity-90 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
