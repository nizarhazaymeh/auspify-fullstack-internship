export const emptyAddress = { fullName: '', phone: '', street: '', city: '', postalCode: '', country: '' };

export function validateAddress(a) {
  const e = {};
  if (a.fullName.trim().length < 2) e.fullName = 'Enter the recipient’s full name.';
  if (!/^[+\d][\d\s()-]{6,20}$/.test(a.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (a.street.trim().length < 3) e.street = 'Enter a street address.';
  if (a.city.trim().length < 2) e.city = 'Enter a city.';
  if (a.country.trim().length < 2) e.country = 'Enter a country.';
  return e;
}

export const trimAddress = (a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, (v ?? '').trim()]));

export default function AddressFields({ value, onChange, errors = {}, idPrefix = 'addr' }) {
  const f = (name, label, props = {}) => (
    <div className={`field ${props.full ? 'field--full' : ''}`}>
      <label htmlFor={`${idPrefix}-${name}`}>{label}</label>
      <input
        id={`${idPrefix}-${name}`}
        value={value[name] ?? ''}
        onChange={(e) => onChange({ ...value, [name]: e.target.value })}
        aria-invalid={Boolean(errors[name])}
        autoComplete={props.autoComplete}
        type={props.type ?? 'text'}
      />
      {errors[name] && <p className="field__error">{errors[name]}</p>}
    </div>
  );
  return (
    <div className="form-grid">
      {f('fullName', 'Full name *', { autoComplete: 'name' })}
      {f('phone', 'Phone *', { autoComplete: 'tel', type: 'tel' })}
      {f('street', 'Street address *', { autoComplete: 'street-address', full: true })}
      {f('city', 'City *', { autoComplete: 'address-level2' })}
      {f('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
      {f('country', 'Country *', { autoComplete: 'country-name' })}
    </div>
  );
}
