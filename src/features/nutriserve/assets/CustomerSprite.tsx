import React from 'react';
import { getCustomerSprite } from './characters';

type Props = {
  customerId: string;
  className?: string;
  style?: React.CSSProperties;
  decorative?: boolean;
  fallback?: React.ReactNode;
};

/** Render the source alpha directly. Never stretch, filter, or synthesize an emotion. */
export function CustomerSprite({ customerId, className, style, decorative = false, fallback = null }: Props) {
  const sprite = getCustomerSprite(customerId);
  if (!sprite) return <>{fallback}</>;
  return <img src={sprite.src} alt={decorative ? '' : `${sprite.name}, waiting to order`}
    className={className} width={1024} height={1536} draggable={false}
    style={{ objectFit: 'contain', ...style }} />;
}
