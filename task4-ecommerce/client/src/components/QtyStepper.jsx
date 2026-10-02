import Icon from './Icon.jsx';

export default function QtyStepper({ value, max, onChange, disabled, label = 'Quantity' }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity">
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
