import { motion } from 'framer-motion';
import { MapPin, Truck, Factory, Droplets, Package, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: MapPin,
    title: 'Sourced',
    description: 'Handpicked from sustainable farms in Vietnam',
    color: '#10B981',
  },
  {
    icon: Truck,
    title: 'Transported',
    description: 'Fresh delivery within 24 hours of harvest',
    color: '#3B82F6',
  },
  {
    icon: Factory,
    title: 'Processed',
    description: 'Cold-pressed to preserve maximum nutrients',
    color: '#F97316',
  },
  {
    icon: Droplets,
    title: 'Extracted',
    description: 'Pure juice with no additives or concentrates',
    color: '#8B5CF6',
  },
  {
    icon: Package,
    title: 'Bottled',
    description: 'Sealed fresh in eco-friendly packaging',
    color: '#EC4899',
  },
  {
    icon: CheckCircle,
    title: 'Delivered',
    description: 'Ready to enjoy at peak freshness',
    color: '#10B981',
  },
];

export default function IngredientJourney() {
  return (
    <section className="py-32 bg-gradient-to-br from-white to-cream relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6">
            FARM TO BOTTLE
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            Follow the journey of every fruit from tree to your table
          </p>
        </motion.div>

        <div className="relative">
          <svg className="absolute top-0 left-0 w-full h-full z-0" style={{ height: '100%' }}>
            <motion.path
              d="M 100 50 Q 300 100, 500 50 T 900 50 T 1300 50"
              stroke="#10B981"
              strokeWidth="4"
              fill="none"
              strokeDasharray="10 5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all"
              >
                <motion.div
                  className="absolute -top-6 left-8 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: step.color }}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <step.icon className="text-white" size={32} />
                </motion.div>

                <motion.div
                  className="absolute top-4 right-4 text-6xl font-black opacity-5"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {index + 1}
                </motion.div>

                <div className="mt-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl"
                  style={{ backgroundColor: step.color, transformOrigin: 'left' }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 text-center bg-primary text-white rounded-3xl p-12 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent rounded-full" />
            </motion.div>

            <h3 className="text-4xl font-black mb-4 relative z-10">
              From Farm to Your Hands in 48 Hours
            </h3>
            <p className="text-xl opacity-90 relative z-10">
              The fastest, freshest juice delivery guaranteed
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
