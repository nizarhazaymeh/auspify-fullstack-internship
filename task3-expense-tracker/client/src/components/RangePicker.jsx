import { PRESETS, rangePreset } from '../utils/format.js';

// Preset dropdown plus custom from/to dates. `value` = { preset, from, to }.
export default function RangePicker({ value, onChange, allowAll = false }) {
  const choose = (preset) => {
    if (preset === 'custom') onChange({ ...value, preset });
    else onChange({ preset, ...rangePreset(preset) });
  };
  return (
    <div className="range">
      <select aria-label="Date range" value={value.preset} onChange={(e) => choose(e.target.value)}>
        {allowAll && <option value="all">All time</option>}
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom range</option>
      </select>
      {value.preset === 'custom' && (
        <>
          <input type="date" aria-label="From" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} />
          <input type="date" aria-label="To" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} />
        </>
      )}
    </div>
  );
}
