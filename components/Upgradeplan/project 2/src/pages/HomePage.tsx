import Hero from '../components/Hero';
import FruitCarousel from '../components/FruitCarousel';
import Features from '../components/Features';
import Products from '../components/Products';
import FruitPicker from '../components/FruitPicker';
import FlavorMeter from '../components/FlavorMeter';
import JuiceMixer from '../components/JuiceMixer';
import About from '../components/About';
import IngredientJourney from '../components/IngredientJourney';
import Certifications from '../components/Certifications';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FruitCarousel />
      <Features />
      <Products />
      <FruitPicker />
      <FlavorMeter />
      <JuiceMixer />
      <About />
      <IngredientJourney />
      <Certifications />
      <Testimonials />
      <Newsletter />
    </>
  );
}
