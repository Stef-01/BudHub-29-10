import { motion } from 'framer-motion';
import { PassionFruit, AcerolaCherry, OrangeSplash, LeafShape } from './DecorativeShapes';
import { Strawberry, Watermelon } from './AdvancedFruitIllustrations';
import { AnimatedBottle, JuiceSplash } from './AnimatedSplashEffects';
import { ScalingFruit } from './AnimatedFruitWrappers';

const products = [
  {
    name: 'Passion & Acerola',
    tagline: 'The Original',
    description: '3.3 passion fruits and 2.2 acerola cherries squeezed into every bottle. 37mg of natural vitamin C.',
    color: 'from-purple-400 to-pink-400',
    stats: ['283g Fresh Fruit', '37mg Vitamin C', '40% Daily Value'],
    icon: PassionFruit,
  },
  {
    name: 'Tropical Mango',
    tagline: 'Smooth & Sweet',
    description: 'Pure mango goodness with a burst of tropical flavor. Rich in vitamins A and C.',
    color: 'from-orange-400 to-yellow-400',
    stats: ['250g Fresh Fruit', 'Rich in Vitamin A', 'No Added Sugar'],
    icon: OrangeSplash,
  },
  {
    name: 'Berry Fusion',
    tagline: 'Antioxidant Power',
    description: 'A blend of strawberries, blueberries, and raspberries packed with antioxidants.',
    color: 'from-red-400 to-pink-400',
    stats: ['290g Fresh Fruit', 'High Antioxidants', 'Heart Healthy'],
    icon: AcerolaCherry,
  },
  {
    name: 'Green Detox',
    tagline: 'Pure & Clean',
    description: 'Apple, spinach, and kale for a refreshing green boost. Natural detoxification.',
    color: 'from-green-400 to-emerald-400',
    stats: ['300g Fresh Greens', 'Detoxifying', 'Alkalizing'],
    icon: LeafShape,
  },
];

export default function Products() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section id="products" className="py-32 bg-white relative overflow-hidden">
      <motion.div
        className="absolute top-20 right-10 opacity-10"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <PassionFruit size={300} />
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
            OUR JUICES
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            Every bottle is packed with real fruit. No concentrates, no shortcuts.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-8 lg:gap-12"
        >
          {products.map((product, index) => {
            const Icon = product.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative"
              >
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-cream rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 relative"
                >
                  <div className={`h-72 bg-gradient-to-br ${product.color} relative overflow-hidden`}>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                    >
                      <AnimatedBottle size={140} />
                    </motion.div>

                    <motion.div
                      className="absolute top-8 right-8 opacity-30"
                      animate={{
                        rotate: [0, 10, 0],
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon size={100} />
                    </motion.div>

                    <motion.div
                      className="absolute bottom-8 left-8 opacity-20"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {index === 0 && <PassionFruit size={80} />}
                      {index === 1 && <OrangeSplash size={80} />}
                      {index === 2 && <Strawberry size={80} />}
                      {index === 3 && <LeafShape size={80} />}
                    </motion.div>

                    <motion.div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <JuiceSplash size={200} color={index % 2 === 0 ? "#F97316" : "#10B981"} />
                    </motion.div>

                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                      <p className="text-sm font-bold text-gray-800">{product.tagline}</p>
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                      {product.name}
                    </h3>
                    <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                      {product.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mb-6">
                      {product.stats.map((stat, i) => (
                        <span
                          key={i}
                          className="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold border-2 border-primary/20"
                        >
                          {stat}
                        </span>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-dark transition-colors duration-300 shadow-lg"
                    >
                      Add to Cart
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
