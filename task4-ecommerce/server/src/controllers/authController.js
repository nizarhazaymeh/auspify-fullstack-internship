import User from '../models/User.js';
import { clearAuthCookie, COOKIE_NAME, setAuthCookie, signToken, verifyToken } from '../middleware/auth.js';

function sendSession(res, user, status = 200) {
  const token = signToken(user.id);
  setAuthCookie(res, token);
  res.status(status).json({ user, token });
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  // Role is never taken from the request: every sign-up is a customer.
  const user = await User.create({ name, email, password });
  sendSession(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  return sendSession(res, user);
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
}

export async function session(req, res) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.json({ user: null });
  try {
    return res.json({ user: await User.findById(verifyToken(token).sub) });
  } catch {
    clearAuthCookie(res);
    return res.json({ user: null });
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res) {
  const { name, address } = req.body;
  if (name !== undefined) req.user.name = name;
  if (address !== undefined) req.user.address = { ...(req.user.address?.toObject?.() ?? {}), ...address };
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
