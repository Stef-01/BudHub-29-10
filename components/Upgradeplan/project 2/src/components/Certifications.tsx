import { motion } from 'framer-motion';
import { Award, CheckCircle, Leaf, Shield, Globe } from 'lucide-react';

const certifications = [
  {
    icon: Award,
    name: 'Rainforest Alliance',
    description: 'Certified sustainable farming',
  },
  {
    icon: CheckCircle,
    name: 'Halal Certified',
    description: 'Meeting Islamic dietary laws',
  },
  {
    icon: Shield,
    name: 'Kosher Certified',
    description: 'Jewish dietary compliance',
  },
  {
    icon: Globe,
    name: 'FSSC 22000',
    description: 'Food safety management',
  },
  {
    icon: Leaf,
    name: 'HACCP',
    description: 'Hazard analysis standards',
  },
];

export default function Certifications() {
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Certified Excellence
          </h3>
          <p className="text-lg text-gray-600">
            Meeting the highest international quality and safety standards
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-8">
          {certifications.map((cert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="flex flex-col items-center justify-center w-32 h-32 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 group cursor-pointer"
            >
              <cert.icon className="text-primary mb-2 group-hover:scale-110 transition-transform" size={32} />
              <div className="text-xs font-bold text-gray-900 text-center leading-tight">
                {cert.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
