import { motion } from 'framer-motion';
import { useState } from 'react';
import { Flame, Droplets, Sparkles } from 'lucide-react';

const flavors = [
  { name: 'Sweet', icon: Sparkles, color: '#EC4899', max: 10 },
  { name: 'Tangy', icon: Droplets, color: '#F97316', max: 10 },
  { name: 'Intense', icon: Flame, color: '#EF4444', max: 10 },
];

export default function FlavorMeter() {
  const [values, setValues] = useState([7, 5, 8]);

  return (
    <section className="py-32 bg-gradient-to-br from-cream to-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6">
            FLAVOR PROFILE
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            Adjust the intensity to discover your perfect taste
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-12 shadow-2xl"
        >
          <div className="space-y-12">
            {flavors.map((flavor, index) => {
              const Icon = flavor.icon;
              const percentage = (values[index] / flavor.max) * 100;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: flavor.color }}
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="text-white" size={28} />
                      </motion.div>
                      <h3 className="text-2xl font-black text-gray-900">
                        {flavor.name}
                      </h3>
                    </div>
                    <motion.span
                      className="text-3xl font-black"
                      style={{ color: flavor.color }}
                      key={values[index]}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {values[index]}
                    </motion.span>
                  </div>

                  <div className="relative">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full relative"
                        style={{ backgroundColor: flavor.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          style={{
                            background: `linear-gradient(90deg, transparent, white, transparent)`,
                          }}
                        />
                      </motion.div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={flavor.max}
                      value={values[index]}
                      onChange={(e) => {
                        const newValues = [...values];
                        newValues[index] = parseInt(e.target.value);
                        setValues(newValues);
                      }}
                      className="absolute top-0 left-0 w-full h-4 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between mt-2 text-sm text-gray-500 font-medium">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Bold</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 pt-8 border-t border-gray-100"
          >
            <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl p-8 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <h4 className="text-2xl font-black text-gray-900 mb-3">
                  Your Perfect Blend
                </h4>
                <p className="text-lg text-gray-600 mb-6">
                  {values[0] > 7 && "Sweet & "}
                  {values[1] > 6 && "Tangy "}
                  {values[2] > 7 && "with Intense Flavor"}
                </p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="bg-primary text-white px-10 py-4 rounded-full font-black text-lg hover:bg-primary-dark transition-colors shadow-lg"
              >
                Create This Flavor
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
