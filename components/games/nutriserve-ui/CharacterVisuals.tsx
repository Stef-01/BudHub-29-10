// components/games/nutriserve-ui/CharacterVisuals.tsx
import React from 'react';

// --- Character A ---
export const CharacterA: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#f3d5b5" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#a0ced9" />
    <circle cx="40" cy="30" r="3" fill="black" />
    <circle cx="60" cy="30" r="3" fill="black" />
    <path d="M45 40 Q 50 42 55 40" stroke="black" fill="none" strokeWidth="1.5" />
  </svg>
);
export const CharacterAHappy: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#f3d5b5" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#a0ced9" />
    <path d="M38 28 Q 40 25 42 28" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M58 28 Q 60 25 62 28" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M45 40 Q 50 48 55 40" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
export const CharacterASad: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#f3d5b5" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#a0ced9" />
    <circle cx="40" cy="30" r="3" fill="black" />
    <circle cx="60" cy="30" r="3" fill="black" />
    <path d="M45 42 Q 50 35 55 42" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);


// --- Character B ---
export const CharacterB: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#e2a76f" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#f25f5c" />
    <circle cx="40" cy="30" r="3" fill="black" />
    <circle cx="60" cy="30" r="3" fill="black" />
    <path d="M45 40 Q 50 42 55 40" stroke="black" fill="none" strokeWidth="1.5" />
  </svg>
);
export const CharacterBHappy: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#e2a76f" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#f25f5c" />
    <path d="M38 28 A 5 5 0 0 1 42 28" stroke="black" fill="none" strokeWidth="1.5" />
    <path d="M58 28 A 5 5 0 0 1 62 28" stroke="black" fill="none" strokeWidth="1.5" />
    <path d="M45 40 A 10 10 0 0 0 55 40" stroke="black" fill="none" strokeWidth="1.5" />
  </svg>
);
export const CharacterBSad: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#e2a76f" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#f25f5c" />
    <circle cx="40" cy="30" r="3" fill="black" />
    <circle cx="60" cy="30" r="3" fill="black" />
    <path d="M45 42 A 10 10 0 0 1 55 42" stroke="black" fill="none" strokeWidth="1.5" />
  </svg>
);

// --- Character C ---
export const CharacterC: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#c18c5d" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#4a7c59" />
    <circle cx="40" cy="30" r="3" fill="black" />
    <circle cx="60" cy="30" r="3" fill="black" />
    <path d="M45 40 L 55 40" stroke="black" fill="none" strokeWidth="1.5" />
    <rect x="40" y="20" width="20" height="2" fill="black" opacity="0.5" />
  </svg>
);
export const CharacterCHappy: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#c18c5d" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#4a7c59" />
    <path d="M38 28 L 42 28" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M58 28 L 62 28" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M45 40 Q 50 45 55 40" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="40" y="20" width="20" height="2" fill="black" opacity="0.5" />
  </svg>
);
export const CharacterCSad: React.FC = () => (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="30" r="20" fill="#c18c5d" />
    <rect x="30" y="50" width="40" height="50" rx="5" fill="#4a7c59" />
    <circle cx="40" cy="30" r="3" fill="black" />
    <circle cx="60" cy="30" r="3" fill="black" />
    <path d="M45 42 Q 50 38 55 42" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="40" y="20" width="20" height="2" fill="black" opacity="0.5" />
  </svg>
);
