import { motion } from 'framer-motion';
import { Leaf, Heart, Zap, Award, Droplets, Sparkles } from 'lucide-react';
import { BlobShape } from './DecorativeShapes';

const features = [
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'Pure fruit juice with no artificial additives, colors, or preservatives. Just nature\'s best.',
    stat: '0g Added Sugar',
  },
  {
    icon: Droplets,
    title: 'Freshly Squeezed',
    description: 'Made from fresh fruit, not concentrates. Every bottle is a burst of authentic flavor.',
    stat: '283g Fresh Fruit',
  },
  {
    icon: Heart,
    title: 'Healthy Choice',
    description: 'Packed with vitamins, minerals, and antioxidants to keep you energized and feeling great.',
    stat: '40% Daily Vitamin C',
  },
  {
    icon: Zap,
    title: 'Instant Energy',
    description: 'Natural sugars from fruit provide a quick, sustained energy boost without the crash.',
    stat: 'Natural Energy',
  },
  {
    icon: Award,
    title: 'Certified Quality',
    description: 'Rainforest Alliance, Halal, Kosher, FSSC 22000, and HACCP certified for your peace of mind.',
    stat: '5+ Certifications',
  },
  {
    icon: Sparkles,
    title: 'Eco-Friendly',
    description: 'Sourced from sustainable farms in Vietnam. Good for you, good for the planet.',
    stat: 'Sustainable Farming',
  },
];

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section id="benefits" className="py-32 bg-cream relative overflow-hidden">
      <motion.div
        className="absolute bottom-10 left-10 opacity-10"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <BlobShape size={400} color="#10B981" />
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
            WHY NUFF?
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            We're committed to delivering the highest quality juice that's good for you and the planet.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
            >
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"
                whileHover={{ scale: 1.5 }}
                transition={{ duration: 0.3 }}
              />

              <div className="relative z-10">
                <motion.div
                  className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <feature.icon className="text-white" size={32} />
                </motion.div>

                <div className="mb-3">
                  <span className="inline-block bg-cream text-primary px-3 py-1 rounded-full text-sm font-bold">
                    {feature.stat}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
