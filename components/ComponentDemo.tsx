import React from 'react';
import { Strawberry, Blueberry, Kiwi, Watermelon, PineappleSlice, GrapeCluster } from '../src/components/illustrations/FruitIllustrations';
import { FloatingFruit, RotatingFruit, BouncingFruit, PulsatingFruit, JuicySplashFruit } from '../src/components/animations/FruitAnimations';
import { BlobShape, LeafShape, StarburstShape } from '../src/components/illustrations/DecorativeShapes';
import { JuiceSplash, AnimatedBottle, ParticleExplosion } from '../src/components/effects/SplashEffects';

/**
 * Component Demo Page - Test all extracted visual components
 * This page showcases all the new SVG illustrations and animations
 */
export default function ComponentDemo() {
  return (
    <div className="min-h-screen bg-cream p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="font-display text-6xl font-black text-primary mb-4 tracking-tight">
          Visual Component Demo
        </h1>
        <p className="font-sans text-xl text-gray-600">
          Testing all 35+ extracted components from Upgradeplan
        </p>
      </div>

      {/* Section 1: Fruit Illustrations */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          🍓 Fruit Illustrations (6 Components)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="glass-card rounded-2xl p-6 text-center">
            <Strawberry size={120} />
            <p className="font-sans text-sm mt-4 font-medium">Strawberry</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <Blueberry size={120} />
            <p className="font-sans text-sm mt-4 font-medium">Blueberry</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <Kiwi size={120} />
            <p className="font-sans text-sm mt-4 font-medium">Kiwi</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <Watermelon size={120} />
            <p className="font-sans text-sm mt-4 font-medium">Watermelon</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <PineappleSlice size={120} />
            <p className="font-sans text-sm mt-4 font-medium">Pineapple</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <GrapeCluster size={120} />
            <p className="font-sans text-sm mt-4 font-medium">Grape</p>
          </div>
        </div>
      </section>

      {/* Section 2: Animated Wrappers */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          ✨ Animation Wrappers (5 Featured)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div className="glass-card rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
            <FloatingFruit delay={0}>
              <Strawberry size={100} />
            </FloatingFruit>
            <p className="font-sans text-sm mt-4 font-medium">FloatingFruit</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
            <RotatingFruit delay={0}>
              <Blueberry size={100} />
            </RotatingFruit>
            <p className="font-sans text-sm mt-4 font-medium">RotatingFruit</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
            <BouncingFruit delay={0}>
              <Watermelon size={100} />
            </BouncingFruit>
            <p className="font-sans text-sm mt-4 font-medium">BouncingFruit</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
            <PulsatingFruit delay={0}>
              <Kiwi size={100} />
            </PulsatingFruit>
            <p className="font-sans text-sm mt-4 font-medium">PulsatingFruit</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
            <JuicySplashFruit>
              <PineappleSlice size={100} />
            </JuicySplashFruit>
            <p className="font-sans text-sm mt-4 font-medium">JuicySplashFruit</p>
            <p className="font-sans text-xs text-gray-500 mt-1">(Hover me!)</p>
          </div>
        </div>
      </section>

      {/* Section 3: Decorative Shapes */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          🎨 Decorative Shapes (3 Components)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-2xl p-12 text-center h-80 flex flex-col items-center justify-center relative overflow-hidden">
            <BlobShape size={250} color="#10B981" className="opacity-30" />
            <p className="font-sans text-sm mt-4 font-medium absolute bottom-6">BlobShape</p>
          </div>
          <div className="glass-card rounded-2xl p-12 text-center h-80 flex flex-col items-center justify-center relative overflow-hidden">
            <LeafShape size={180} className="opacity-80" />
            <p className="font-sans text-sm mt-4 font-medium absolute bottom-6">LeafShape</p>
          </div>
          <div className="glass-card rounded-2xl p-12 text-center h-80 flex flex-col items-center justify-center relative overflow-hidden">
            <StarburstShape size={180} className="opacity-80" />
            <p className="font-sans text-sm mt-4 font-medium absolute bottom-6">StarburstShape</p>
          </div>
        </div>
      </section>

      {/* Section 4: Splash Effects */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          💦 Splash Effects (3 Components)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-2xl p-12 text-center h-96 flex flex-col items-center justify-center relative overflow-hidden">
            <JuiceSplash size={200} color="#F97316" />
            <p className="font-sans text-sm mt-4 font-medium absolute bottom-6">JuiceSplash</p>
          </div>
          <div className="glass-card rounded-2xl p-12 text-center h-96 flex flex-col items-center justify-center relative overflow-hidden">
            <AnimatedBottle size={220} />
            <p className="font-sans text-sm mt-4 font-medium absolute bottom-6">AnimatedBottle</p>
          </div>
          <div className="glass-card rounded-2xl p-12 text-center h-96 flex flex-col items-center justify-center relative overflow-hidden">
            <ParticleExplosion size={200} color="#F59E0B" />
            <p className="font-sans text-sm mt-4 font-medium absolute bottom-6">ParticleExplosion</p>
          </div>
        </div>
      </section>

      {/* Section 5: Typography Showcase */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          🔤 Typography System
        </h2>
        <div className="glass-card rounded-2xl p-12 space-y-6">
          <div>
            <p className="font-sans text-sm text-gray-500 mb-2">Display Font (Outfit)</p>
            <h3 className="font-display text-5xl font-black text-primary">
              Your Logan Health Journey
            </h3>
          </div>
          <div>
            <p className="font-sans text-sm text-gray-500 mb-2">Sans Font (Inter)</p>
            <p className="font-sans text-lg text-gray-700">
              Managing diabetes through healthy eating and local produce. The BudHub community supports 23,017 people in Logan.
            </p>
          </div>
          <div>
            <p className="font-sans text-sm text-gray-500 mb-2">Accent Font (Space Grotesk)</p>
            <div className="font-accent text-3xl font-bold text-green-600">
              23,017 Community Members
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Color Palette */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          🎨 Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="text-center">
            <div className="w-full h-24 bg-primary rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Primary</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-strawberry rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Strawberry</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-blueberry rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Blueberry</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-kiwi rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Kiwi</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-watermelon rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Watermelon</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-pineapple rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Pineapple</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-grape rounded-xl mb-2"></div>
            <p className="font-sans text-xs font-medium">Grape</p>
          </div>
        </div>
      </section>

      {/* Section 7: Glass Morphism Demo */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="font-display text-4xl font-bold text-gray-900 mb-8">
          🪟 Glass Morphism Effects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">Glass Card</h3>
            <p className="font-sans text-gray-600">
              Frosted white glass effect with backdrop blur and subtle shadows.
            </p>
          </div>
          <div className="glass-card-dark rounded-2xl p-8">
            <h3 className="font-display text-2xl font-bold text-white mb-3">Glass Card Dark</h3>
            <p className="font-sans text-gray-300">
              Dark variant with enhanced contrast for overlays and modals.
            </p>
          </div>
          <div className="glass-card-colored rounded-2xl p-8">
            <h3 className="font-display text-2xl font-bold text-green-900 mb-3">Glass Card Colored</h3>
            <p className="font-sans text-green-800">
              Colored tint with green accent for branded elements.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto text-center py-12">
        <p className="font-sans text-gray-500">
          ✅ Phase 1 Complete: All 35+ components extracted and ready to use
        </p>
      </footer>
    </div>
  );
}
