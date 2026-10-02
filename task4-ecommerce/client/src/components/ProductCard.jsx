import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage.jsx';
import Price from './Price.jsx';
import Icon from './Icon.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from './Toast.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const soldOut = product.stock === 0;

  const quickAdd = async () => {
    setBusy(true);
    try {
      await add(product, 1);
      notify(`Added ${product.name} to your cart.`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="pcard">
      <Link to={`/product/${product.slug}`} className="pcard__media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
        {product.compareAtPrice > product.price && <span className="pcard__flag">Sale</span>}
        {soldOut && <span className="pcard__flag pcard__flag--muted">Sold out</span>}
      </Link>
      <div className="pcard__body">
        <span className="pcard__brand">{product.brand || product.category}</span>
        <Link to={`/product/${product.slug}`} className="pcard__name">
          {product.name}
        </Link>
        <div className="pcard__foot">
          <Price price={product.price} compareAt={product.compareAtPrice} />
          <button
            type="button"
            className="icon-btn icon-btn--primary"
            onClick={quickAdd}
            disabled={soldOut || busy}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
            title={soldOut ? 'Sold out' : 'Add to cart'}
          >
            <Icon name="cart" />
          </button>
        </div>
        {!soldOut && product.stock <= 5 && <span className="pcard__low">Only {product.stock} left</span>}
      </div>
    </article>
  );
}
