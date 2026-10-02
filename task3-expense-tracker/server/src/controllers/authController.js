import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { clearAuthCookie, COOKIE_NAME, setAuthCookie, signToken, verifyToken } from '../middleware/auth.js';

function sendSession(res, user, status = 200) {
  const token = signToken(user.id);
  setAuthCookie(res, token);
  // The token is also returned for API clients (Postman); the browser app relies on the httpOnly cookie.
  res.status(status).json({ user, token });
}

export async function register(req, res) {
  const { name, email, password, currency } = req.body;
  const user = await User.create({ name, email, password, currency });
  sendSession(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  return sendSession(res, user);
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
}

// Like /me, but answers 200 with { user: null } when logged out (used for the app's initial check).
export async function session(req, res) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.json({ user: null });
  try {
    const { sub } = verifyToken(token);
    return res.json({ user: await User.findById(sub) });
  } catch {
    clearAuthCookie(res);
    return res.json({ user: null });
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res) {
  const { name, currency } = req.body;
  if (name !== undefined) req.user.name = name;
  if (currency !== undefined) req.user.currency = currency;
  await req.user.save();
  res.json({ user: req.user });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.checkPassword(req.body.currentPassword))) {
    return res.status(400).json({ message: 'Validation failed', errors: { currentPassword: 'Current password is incorrect' } });
  }
  user.password = req.body.newPassword;
  await user.save();
  return sendSession(res, user);
}

export async function deleteAccount(req, res) {
  await Transaction.deleteMany({ user: req.user._id });
  await req.user.deleteOne();
  clearAuthCookie(res);
  res.json({ message: 'Account deleted' });
}
