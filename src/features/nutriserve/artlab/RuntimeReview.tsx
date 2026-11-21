import React from 'react';
import { RUNTIME_IMAGES } from '../assets/runtimeImages';

/** Review downloads masters intentionally. Game components request runtime copies only. */
export function RuntimeReview() {
  return <section id="runtime-review" aria-labelledby="runtime-title">
    <h2 id="runtime-title">Master / runtime comparison</h2>
    <p>Uncropped source beside the lossless WebP derivative on a dark background. Character rows include 22px thumbnails; all images retain their master anchors.</p>
    <div className="runtime-review-grid">{Object.entries(RUNTIME_IMAGES).map(([source, variants]) => {
      const character = source.includes('/characters/');
      const garnish = source.includes('/garnishes/');
      const height = character ? 180 : garnish ? 48 : 140;
      const runtime = character ? variants[1] : variants[0];
      return <figure key={source}>
        <figcaption>{source.split('/').at(-1)?.replace('.png', '')}</figcaption>
        <div className="runtime-pair bg-dark">
          <img src={source} height={height} alt="PNG master" />
          <img src={runtime.path} height={height} alt="WebP runtime" />
        </div>
        {character && <div className="runtime-pair bg-checker"><img src={source} height="22" alt="Master thumbnail" /><img src={variants[0].path} height="22" alt="Runtime thumbnail" /></div>}
        <small>PNG master / WebP runtime</small>
      </figure>;
    })}</div>
  </section>;
}
