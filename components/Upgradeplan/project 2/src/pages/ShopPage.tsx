import { motion } from 'framer-motion';
import { useState } from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { AnimatedBottle } from '../components/AnimatedSplashEffects';
import { BlobCharacter } from '../components/CharacterIllustrations';
import { PassionFruit, OrangeSplash, AcerolaCherry } from '../components/DecorativeShapes';
import { Strawberry, Watermelon, PineappleSlice } from '../components/AdvancedFruitIllustrations';

const products = [
  {
    id: 1,
    name: 'Passion & Acerola',
    price: '$4.99',
    description: 'Tropical paradise in every sip',
    icon: PassionFruit,
    color: 'from-purple-400 to-pink-400',
    bgColor: '#F3E8FF',
  },
  {
    id: 2,
    name: 'Orange Sunrise',
    price: '$3.99',
    description: 'Wake up to citrus freshness',
    icon: OrangeSplash,
    color: 'from-orange-400 to-yellow-400',
    bgColor: '#FFF7ED',
  },
  {
    id: 3,
    name: 'Berry Blast',
    price: '$5.49',
    description: 'Antioxidant powerhouse',
    icon: Strawberry,
    color: 'from-red-400 to-pink-500',
    bgColor: '#FEF2F2',
  },
  {
    id: 4,
    name: 'Tropical Punch',
    price: '$4.49',
    description: 'Island vibes in a bottle',
    icon: PineappleSlice,
    color: 'from-yellow-300 to-orange-400',
    bgColor: '#FFFBEB',
  },
  {
    id: 5,
    name: 'Watermelon Wave',
    price: '$3.99',
    description: 'Summer in every gulp',
    icon: Watermelon,
    color: 'from-pink-400 to-red-400',
    bgColor: '#FFEDD5',
  },
  {
    id: 6,
    name: 'Acerola Cherry',
    price: '$5.99',
    description: 'Vitamin C explosion',
    icon: AcerolaCherry,
    color: 'from-red-500 to-pink-500',
    bgColor: '#FEE2E2',
  },
];

export default function ShopPage() {
  const [cart, setCart] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addToCart = (id: number) => {
    setCart(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] pt-24">
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20 relative"
          >
            <motion.div
              className="absolute -top-10 left-[20%]"
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BlobCharacter size={80} color="#FBBF24" />
            </motion.div>

            <motion.div
              className="absolute -top-10 right-[20%]"
              animate={{
                y: [0, 15, 0],
                rotate: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <BlobCharacter size={100} color="#10B981" />
            </motion.div>

            <h1 className="text-[120px] md:text-[180px] font-black text-[#10B981] leading-none mb-6">
              SHOP
            </h1>
            <p className="text-3xl text-[#4B5563] font-bold">
              Fresh juices delivered to your door
            </p>

            {cart.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed top-24 right-8 bg-[#10B981] text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl z-50"
              >
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-[#F87171] w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">
                  {cart.length}
                </span>
              </motion.div>
            )}
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => {
              const Icon = product.icon;
              const isFavorite = favorites.includes(product.id);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="rounded-[40px] overflow-hidden shadow-xl relative"
                  style={{ backgroundColor: product.bgColor }}
                >
                  <motion.button
                    onClick={() => toggleFavorite(product.id)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-6 right-6 z-20 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                  >
                    <Heart
                      size={24}
                      fill={isFavorite ? '#F87171' : 'none'}
                      color={isFavorite ? '#F87171' : '#9CA3AF'}
                    />
                  </motion.button>

                  <div className={`h-64 bg-gradient-to-br ${product.color} relative flex items-center justify-center`}>
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <AnimatedBottle size={180} />
                    </motion.div>

                    <motion.div
                      className="absolute top-6 left-6"
                      animate={{
                        rotate: [0, 15, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon size={80} className="opacity-40" />
                    </motion.div>

                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                      <Star size={16} fill="#FBBF24" color="#FBBF24" />
                      <span className="text-sm font-black">4.9</span>
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-3xl font-black text-[#1F2937] mb-3">
                      {product.name}
                    </h3>
                    <p className="text-lg text-[#6B7280] mb-6 font-medium">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-black text-[#10B981]">
                        {product.price}
                      </span>

                      <motion.button
                        onClick={() => addToCart(product.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#10B981] text-white px-8 py-4 rounded-full font-black text-lg hover:bg-[#059669] transition-colors shadow-lg flex items-center gap-3"
                      >
                        <ShoppingCart size={20} />
                        Add
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-20 bg-[#10B981] rounded-[50px] p-16 text-center relative overflow-hidden"
          >
            <h2 className="text-6xl font-black text-white mb-6">
              FREE SHIPPING
            </h2>
            <p className="text-2xl text-white/90 font-bold">
              On orders over $25 • Delivered fresh daily
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
