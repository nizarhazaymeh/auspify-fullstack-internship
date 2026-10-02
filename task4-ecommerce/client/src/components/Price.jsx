import { formatMoney } from '../utils/format.js';

export default function Price({ price, compareAt, large = false }) {
  const off = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  return (
    <span className={`price ${large ? 'price--lg' : ''}`}>
      <span className="price__now">{formatMoney(price)}</span>
      {off > 0 && (
        <>
          <s className="price__was">{formatMoney(compareAt)}</s>
          <span className="price__off">−{off}%</span>
        </>
      )}
    </span>
  );
}
