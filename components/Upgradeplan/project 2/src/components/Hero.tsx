import { motion, useScroll, useTransform } from 'framer-motion';
import { PassionFruit, AcerolaCherry, OrangeSplash, LeafShape, BlobShape, StarburstShape } from './DecorativeShapes';
import { Strawberry, Blueberry, Kiwi, Watermelon, PineappleSlice, GrapeCluster } from './AdvancedFruitIllustrations';
import { FloatingFruit, RotatingFruit, BouncingFruit, PulsatingFruit, SwingingFruit } from './AnimatedFruitWrappers';
import { JuiceSplash, ParticleExplosion } from './AnimatedSplashEffects';

export default function Hero() {
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const y3 = useTransform(scrollY, [0, 500], [0, 200]);
  const rotate1 = useTransform(scrollY, [0, 500], [0, 45]);
  const rotate2 = useTransform(scrollY, [0, 500], [0, -30]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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
    <section className="min-h-screen bg-cream flex items-center justify-center relative overflow-hidden pt-20">
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[10%] left-[5%] z-0"
      >
        <RotatingFruit delay={0}>
          <PassionFruit size={200} className="opacity-80" />
        </RotatingFruit>
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute top-[8%] right-[8%] z-0"
      >
        <PulsatingFruit delay={0.5}>
          <OrangeSplash size={180} className="opacity-70" />
        </PulsatingFruit>
      </motion.div>

      <motion.div
        style={{ y: y3, rotate: rotate2 }}
        className="absolute bottom-[18%] left-[12%] z-0"
      >
        <BouncingFruit delay={1}>
          <AcerolaCherry size={150} className="opacity-75" />
        </BouncingFruit>
      </motion.div>

      <FloatingFruit delay={0.3} className="absolute top-[25%] left-[20%] z-0">
        <Strawberry size={140} className="opacity-80" />
      </FloatingFruit>

      <SwingingFruit delay={0.7} className="absolute top-[50%] right-[10%] z-0">
        <Blueberry size={100} className="opacity-75" />
      </SwingingFruit>

      <RotatingFruit delay={1.2} className="absolute bottom-[35%] right-[15%] z-0">
        <Kiwi size={130} className="opacity-70" />
      </RotatingFruit>

      <FloatingFruit delay={0.9} className="absolute top-[60%] left-[8%] z-0">
        <Watermelon size={160} className="opacity-65" />
      </FloatingFruit>

      <BouncingFruit delay={1.5} className="absolute bottom-[10%] right-[25%] z-0">
        <PineappleSlice size={120} className="opacity-70" />
      </BouncingFruit>

      <PulsatingFruit delay={0.4} className="absolute top-[70%] right-[5%] z-0">
        <GrapeCluster size={110} className="opacity-75" />
      </PulsatingFruit>

      <motion.div
        className="absolute top-[35%] right-[30%] z-0 opacity-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <JuiceSplash size={180} color="#F97316" />
      </motion.div>

      <motion.div
        className="absolute bottom-[45%] left-[25%] z-0 opacity-30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <ParticleExplosion size={150} color="#10B981" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[40%] left-[3%] z-0"
      >
        <LeafShape size={120} className="opacity-60" />
      </motion.div>

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[8%] right-[20%] z-0"
      >
        <StarburstShape size={140} className="opacity-50" />
      </motion.div>

      <motion.div
        className="absolute top-[45%] left-[8%] z-0"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <BlobShape size={200} color="#F97316" />
      </motion.div>

      <motion.div
        className="absolute bottom-[25%] right-[3%] z-0"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <BlobShape size={180} color="#8B5CF6" />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 text-center relative z-10"
      >
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-8xl lg:text-[10rem] font-black text-primary mb-6 leading-[0.9] tracking-tight"
          style={{
            textShadow: '3px 3px 0px rgba(5, 170, 86, 0.1)',
          }}
        >
          NUFF
          <br />
          <span className="text-5xl md:text-7xl lg:text-8xl text-gray-800">
            IS ENOUGH
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl lg:text-3xl text-gray-700 mb-12 max-w-3xl mx-auto font-medium"
        >
          100% natural fruit juice.
          <br />
          <span className="text-primary font-bold">283g of fresh fruit</span> in every bottle.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-primary-dark transition-colors duration-300 shadow-lg hover:shadow-2xl"
          >
            Shop Now
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white text-primary border-3 border-primary px-10 py-5 rounded-full text-lg font-bold hover:bg-primary hover:text-white transition-all duration-300 shadow-lg"
          >
            Learn More
          </motion.button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-16"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-6 h-10 border-2 border-primary rounded-full mx-auto relative">
            <motion.div
              className="w-2 h-2 bg-primary rounded-full absolute top-2 left-1/2 transform -translate-x-1/2"
              animate={{
                y: [0, 12, 0],
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
