import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Shop', path: '/shop' },
    { name: 'Philosophy', path: '/philosophy' },
    { name: 'Story', path: '/story' },
    { name: 'Home', path: '/' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg backdrop-blur-sm' : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="text-3xl font-black text-primary tracking-tight cursor-pointer"
            >
              NUFF
            </motion.div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <Link key={item.name} to={item.path}>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-gray-700 hover:text-primary transition-colors duration-300 font-bold relative group cursor-pointer"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </motion.div>
              </Link>
            ))}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark transition-all duration-300 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <ShoppingBag size={18} />
              Shop Now
            </motion.button>
          </nav>

          <motion.button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50"
            >
              <div className="flex justify-end p-6">
                <motion.button
                  onClick={() => setIsMenuOpen(false)}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={28} />
                </motion.button>
              </div>
              <nav className="flex flex-col space-y-6 px-6">
                {navItems.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="text-gray-700 hover:text-primary transition-colors duration-300 font-bold text-xl cursor-pointer"
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                ))}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="bg-primary text-white px-6 py-4 rounded-full hover:bg-primary-dark transition-all duration-300 mt-4 font-bold text-lg flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={20} />
                  Shop Now
                </motion.button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
