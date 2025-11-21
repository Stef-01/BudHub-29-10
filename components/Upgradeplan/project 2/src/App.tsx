import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import SmoothScroll from './components/SmoothScroll';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './pages/HomePage';
import PhilosophyPage from './pages/PhilosophyPage';
import ShopPage from './pages/ShopPage';
import StoryPage from './pages/StoryPage';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.body.style.cursor = 'none';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className="min-h-screen overflow-x-hidden">
        <CustomCursor />
        <SmoothScroll />
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/philosophy" element={<PhilosophyPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/story" element={<StoryPage />} />
        </Routes>

        <Footer />
      </div>
    </>
  );
}

export default App;
