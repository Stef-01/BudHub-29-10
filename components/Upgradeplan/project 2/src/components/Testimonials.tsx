import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { OrangeSplash } from './DecorativeShapes';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Fitness Enthusiast',
    text: 'Nuff Juice has become my go-to post-workout drink. The energy boost is incredible, and I love that it\'s all natural!',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Busy Professional',
    text: 'Finally, a juice that tastes amazing and keeps me energized throughout my hectic workday. No artificial aftertaste!',
    rating: 5,
  },
  {
    name: 'Emma Williams',
    role: 'Health Coach',
    text: 'I recommend Nuff Juice to all my clients. It\'s the perfect balance of taste and nutrition. Pure quality!',
    rating: 5,
  },
];

export default function Testimonials() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section id="reviews" className="py-32 bg-white relative overflow-hidden">
      <motion.div
        className="absolute top-20 left-10 opacity-10"
        animate={{
          rotate: [0, -360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <OrangeSplash size={250} />
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
            REAL REVIEWS
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
            Join thousands of happy customers loving every sip.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-cream p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex mb-6 gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="text-primary fill-current" size={22} />
                ))}
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-black text-xl mr-4">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm font-medium">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
