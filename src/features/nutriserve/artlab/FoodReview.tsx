import React, { useState } from 'react';
import { VesselTop, foodColor } from '../ui/LayoutStudy';
import { FoodSurface } from '../assets/FoodSurface';
import { FOOD_SURFACES } from '../assets/foodSurfaces';

const pieces = [
  { id: 'coriander', x: -.35, y: -.15, fell: false },
  { id: 'onion', x: .32, y: .2, fell: false },
  { id: 'lemon', x: -.25, y: .42, fell: false },
];
export function FoodReview() {
  const [background, setBackground] = useState('cream');
  const [showPieces, setShowPieces] = useState(true);
  const samples = [
    { label: 'Before · color study', main: 'chana_masala', art: false },
    { label: 'Rice + chana masala', main: 'chana_masala', art: true },
    { label: 'Rice + palak dal', main: 'palak_dal', art: true },
    { label: 'Unproduced food · color fallback', main: 'chicken_curry', art: true },
  ];
  return <section id="food-review" aria-labelledby="food-review-title">
    <h2 id="food-review-title">Food and katori · before / after</h2>
    <p>Actual Finish renderer at 268px and 140px. The serving boundary stays at local radius 1. Side-view vessels and the remaining food catalog still need art.</p>
    <div className="food-review-controls">
      {['cream', 'dark', 'checker'].map(bg => <button key={bg} aria-pressed={background === bg} onClick={() => setBackground(bg)}>{bg} food background</button>)}
      <label><input type="checkbox" checked={showPieces} onChange={e => setShowPieces(e.target.checked)} /> Show garnish contrast</label>
    </div>
    <div className={`food-review-grid bg-${background}`}>{samples.map(sample => <figure key={sample.label}>
      {[268, 140].map(size => <div key={size} className="ns-vessel-top" style={{ width: size, maxWidth: '100%', aspectRatio: '1' }}>
        <VesselTop label={`${sample.label} at ${size}px`} baseColor={foodColor('rice_white')} mainColor={foodColor(sample.main)}
          baseFoodId="rice_white" mainFoodId={sample.main} useArtwork={sample.art} drizzles={[]} garnishes={showPieces ? pieces : []} />
      </div>)}<figcaption>{sample.label}</figcaption>
    </figure>)}</div>
    <h3>Source silhouettes · 96px</h3>
    <div className="food-source-row bg-checker">{Object.keys(FOOD_SURFACES).map(id => <figure key={id}>
      <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={`${id.replaceAll('_', ' ')} source`}><FoodSurface id={id} x={0} y={0} diameter={96} /></svg>
      <figcaption>{id.replaceAll('_', ' ')}</figcaption>
    </figure>)}</div>
  </section>;
}
