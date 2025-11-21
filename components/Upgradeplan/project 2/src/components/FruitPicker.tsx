import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Strawberry, Blueberry, Kiwi, Watermelon, PineappleSlice, GrapeCluster } from './AdvancedFruitIllustrations';
import { PassionFruit, AcerolaCherry, OrangeSplash } from './DecorativeShapes';
import { Check } from 'lucide-react';

const fruits = [
  { id: 1, name: 'Passion Fruit', component: PassionFruit, color: '#8B5CF6', benefits: 'Rich in Vitamin A' },
  { id: 2, name: 'Acerola', component: AcerolaCherry, color: '#EF4444', benefits: 'Highest Vitamin C' },
  { id: 3, name: 'Orange', component: OrangeSplash, color: '#F97316', benefits: 'Immune Boost' },
  { id: 4, name: 'Strawberry', component: Strawberry, color: '#E53E3E', benefits: 'Heart Healthy' },
  { id: 5, name: 'Blueberry', component: Blueberry, color: '#4C51BF', benefits: 'Brain Power' },
  { id: 6, name: 'Kiwi', component: Kiwi, color: '#84CC16', benefits: 'Digestive Aid' },
  { id: 7, name: 'Watermelon', component: Watermelon, color: '#F43F5E', benefits: 'Hydration' },
  { id: 8, name: 'Pineapple', component: PineappleSlice, color: '#FBBF24', benefits: 'Anti-inflammatory' },
  { id: 9, name: 'Grape', component: GrapeCluster, color: '#7C3AED', benefits: 'Antioxidants' },
];

export default function FruitPicker() {
  const [selectedFruits, setSelectedFruits] = useState<number[]>([]);
  const [hoveredFruit, setHoveredFruit] = useState<number | null>(null);

  const toggleFruit = (id: number) => {
    setSelectedFruits(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const selectedFruitData = fruits.filter(f => selectedFruits.includes(f.id));

  return (
    <section className="py-32 bg-gradient-to-br from-cream to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6">
            BUILD YOUR JUICE
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            Select your favorite fruits to create your perfect blend
          </p>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
          {fruits.map((fruit, index) => {
            const FruitComponent = fruit.component;
            const isSelected = selectedFruits.includes(fruit.id);
            const isHovered = hoveredFruit === fruit.id;

            return (
              <motion.div
                key={fruit.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleFruit(fruit.id)}
                onMouseEnter={() => setHoveredFruit(fruit.id)}
                onMouseLeave={() => setHoveredFruit(null)}
                className={`relative p-6 rounded-3xl cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'bg-primary shadow-2xl'
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
              >
                <motion.div
                  animate={{
                    rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <FruitComponent size={100} />

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Check className="text-primary" size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div className="mt-4 text-center">
                  <p className={`font-black text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {fruit.name}
                  </p>
                </div>

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute inset-x-0 -bottom-16 bg-white px-3 py-2 rounded-lg shadow-xl text-xs font-bold text-center text-gray-700 z-20"
                    >
                      {fruit.benefits}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedFruits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-3xl font-black text-gray-900 mb-6 text-center">
                Your Custom Blend
              </h3>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {selectedFruitData.map((fruit, index) => (
                  <motion.div
                    key={fruit.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                         style={{ backgroundColor: fruit.color + '20' }}>
                      <fruit.component size={60} />
                    </div>
                    <p className="text-xs font-bold text-gray-700">{fruit.name}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-cream p-6 rounded-2xl">
                  <h4 className="font-black text-lg mb-3">Health Benefits</h4>
                  <ul className="space-y-2">
                    {selectedFruitData.map((fruit, index) => (
                      <motion.li
                        key={fruit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center text-sm"
                      >
                        <Check className="text-primary mr-2" size={16} />
                        {fruit.benefits}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="bg-cream p-6 rounded-2xl">
                  <h4 className="font-black text-lg mb-3">Nutrition Stats</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold">Vitamin C</span>
                        <span className="text-primary font-black">{selectedFruits.length * 12}mg</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(selectedFruits.length * 20, 100)}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold">Antioxidants</span>
                        <span className="text-primary font-black">{selectedFruits.length * 8}%</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(selectedFruits.length * 18, 100)}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold">Natural Energy</span>
                        <span className="text-primary font-black">{selectedFruits.length * 15}cal</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(selectedFruits.length * 22, 100)}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-primary text-white px-8 py-5 rounded-full font-black text-xl hover:bg-primary-dark transition-colors shadow-lg"
              >
                Create My Blend ({selectedFruits.length} fruits)
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
