import Icon from './Icon.jsx';
import { STATUS_LABELS, formatDateTime } from '../utils/format.js';

const FLOW = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    const at = order.statusHistory.find((h) => h.status === 'cancelled')?.at;
    return (
      <div className="banner banner--error">
        This order was cancelled{at ? ` on ${formatDateTime(at)}` : ''}. Any reserved items were returned to stock.
      </div>
    );
  }
  const current = FLOW.indexOf(order.status);
  return (
    <ol className="timeline">
      {FLOW.map((s, i) => {
        const at = order.statusHistory.find((h) => h.status === s)?.at;
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s} className={`timeline__step timeline__step--${state}`}>
            <span className="timeline__dot">{i <= current ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className="timeline__label">{STATUS_LABELS[s]}</span>
            {at && <span className="timeline__at">{formatDateTime(at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
