import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { Strawberry, Blueberry, Kiwi, Watermelon, PineappleSlice, GrapeCluster } from './AdvancedFruitIllustrations';
import { PassionFruit, AcerolaCherry, OrangeSplash } from './DecorativeShapes';

const fruits = [
  { component: Strawberry, name: 'Strawberry', color: '#E53E3E' },
  { component: Blueberry, name: 'Blueberry', color: '#4C51BF' },
  { component: Kiwi, name: 'Kiwi', color: '#84CC16' },
  { component: Watermelon, name: 'Watermelon', color: '#F43F5E' },
  { component: PineappleSlice, name: 'Pineapple', color: '#FBBF24' },
  { component: GrapeCluster, name: 'Grape', color: '#7C3AED' },
  { component: PassionFruit, name: 'Passion', color: '#8B5CF6' },
  { component: AcerolaCherry, name: 'Acerola', color: '#EF4444' },
  { component: OrangeSplash, name: 'Orange', color: '#F97316' },
];

const duplicatedFruits = [...fruits, ...fruits, ...fruits];

export default function FruitCarousel() {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      x: [0, -1800],
      transition: {
        duration: 30,
        repeat: Infinity,
        ease: 'linear',
      },
    });
  }, [controls]);

  return (
    <section className="py-20 bg-cream overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cream via-transparent to-cream z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12 relative z-20"
      >
        <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
          FRESH INGREDIENTS
        </h3>
        <p className="text-lg text-gray-600">
          All natural, all delicious
        </p>
      </motion.div>

      <motion.div
        animate={controls}
        className="flex gap-8 items-center"
        style={{ width: 'fit-content' }}
      >
        {duplicatedFruits.map((fruit, index) => {
          const FruitComponent = fruit.component;
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.2, y: -10 }}
              className="flex-shrink-0 w-32 h-32 flex items-center justify-center bg-white rounded-3xl shadow-lg relative group cursor-pointer"
              style={{
                boxShadow: `0 10px 30px ${fruit.color}30`,
              }}
            >
              <FruitComponent size={100} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap"
              >
                <p className="font-black text-sm text-gray-900">{fruit.name}</p>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
