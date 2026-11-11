// components/cookventure/shared/CvAsset.tsx
// Shows Cookventure artwork when it has been added, and the emoji fallback until then.
import React, { useState } from 'react';
import { getAssetUrl, type AssetCategory } from '../../../services/cookventure/assets';

interface CvAssetProps {
  category: AssetCategory;
  id: string;
  /** Emoji shown when there is no artwork (or it fails to load) */
  fallback: string;
  /** Tailwind size classes for the image, e.g. "w-12 h-12" */
  className?: string;
  /** Classes for the emoji fallback, e.g. "text-4xl" */
  fallbackClassName?: string;
  /** Alt text; leave empty when the label is already next to the image */
  alt?: string;
}

const CvAsset: React.FC<CvAssetProps> = ({ category, id, fallback, className = 'w-10 h-10', fallbackClassName = '', alt = '' }) => {
  const url = getAssetUrl(category, id);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span className={fallbackClassName} aria-hidden={alt ? undefined : true} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        {fallback}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`${className} object-contain inline-block`}
    />
  );
};

export default CvAsset;
