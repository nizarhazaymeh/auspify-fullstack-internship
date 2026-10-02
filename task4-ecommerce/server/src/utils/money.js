// Amounts are stored as integer minor units (cents) to avoid floating point errors.
export const toCents = (amount) => Math.round(Number(amount) * 100);
export const fromCents = (cents) => Math.round(cents) / 100;
