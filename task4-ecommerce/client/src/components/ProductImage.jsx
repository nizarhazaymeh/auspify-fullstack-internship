import { useState } from 'react';
import { categoryHue } from '../utils/format.js';

// Shows the product photo when one is set; otherwise a gradient tile with the product's emoji.
export default function ProductImage({ product, size = 'md' }) {
  const [broken, setBroken] = useState(false);
  const hue = categoryHue(product.category);
  if (product.image && !broken) {
    return (
      <div className={`pimg pimg--${size}`}>
        <img src={product.image} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
      </div>
    );
  }
  return (
    <div className={`pimg pimg--${size} pimg--emoji`} style={{ '--hue': hue }} role="img" aria-label={product.name}>
      <span aria-hidden="true">{product.emoji || '🛍️'}</span>
    </div>
  );
}
