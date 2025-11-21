import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { PassionFruit, StarburstShape } from './DecorativeShapes';
import { Strawberry, PineappleSlice, Watermelon } from './AdvancedFruitIllustrations';
import { OrbitingFruit, FloatingFruit, BouncingFruit } from './AnimatedFruitWrappers';
import { ParticleExplosion } from './AnimatedSplashEffects';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-32 bg-primary relative overflow-hidden">
      <FloatingFruit delay={0} className="absolute top-10 left-10 opacity-20">
        <PassionFruit size={200} />
      </FloatingFruit>

      <OrbitingFruit delay={0} radius={80} className="absolute top-1/4 left-[10%] opacity-25">
        <Strawberry size={120} />
      </OrbitingFruit>

      <BouncingFruit delay={0.5} className="absolute bottom-20 left-[20%] opacity-20">
        <PineappleSlice size={140} />
      </BouncingFruit>

      <FloatingFruit delay={1} className="absolute top-1/3 right-[15%] opacity-20">
        <Watermelon size={160} />
      </FloatingFruit>

      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <ParticleExplosion size={300} color="#FCD34D" />
      </motion.div>

      <motion.div
        className="absolute bottom-10 right-10 opacity-20"
        animate={{
          rotate: [0, 180, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <StarburstShape size={180} />
      </motion.div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Mail size={64} className="text-white" />
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6">
            STAY FRESH
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 font-medium">
            Get exclusive offers, new flavor alerts, and health tips delivered to your inbox.
          </p>

          {!isSubmitted ? (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-8 py-5 rounded-full text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-primary px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2 group"
              >
                Subscribe
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-6 rounded-full text-xl font-bold inline-block"
            >
              Thanks for subscribing! Check your inbox.
            </motion.div>
          )}

          <p className="text-white/70 text-sm mt-6">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
