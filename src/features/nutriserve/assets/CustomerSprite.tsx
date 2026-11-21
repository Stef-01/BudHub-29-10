import React from 'react';
import { getCustomerSprite } from './characters';
import { runtimeVariants } from './runtimeImages';

type Props = {
  customerId: string;
  className?: string;
  style?: React.CSSProperties;
  decorative?: boolean;
  fallback?: React.ReactNode;
  /** CSS image width for responsive candidate selection; thumbnails supply their own width. */
  sizes?: string;
};

/** Render the source alpha directly. Never stretch, filter, or synthesize an emotion. */
export function CustomerSprite({ customerId, className, style, decorative = false, fallback = null, sizes = '240px' }: Props) {
  const sprite = getCustomerSprite(customerId);
  if (!sprite) return <>{fallback}</>;
  const variants = runtimeVariants(sprite.src);
  return <img src={variants?.[1]?.path ?? sprite.src}
    srcSet={variants?.map(v => `${v.path} ${v.width}w`).join(', ')} sizes={sizes}
    alt={decorative ? '' : `${sprite.name}, waiting to order`}
    className={className} width={1024} height={1536} draggable={false}
    style={{ objectFit: 'contain', ...style }} />;
}
