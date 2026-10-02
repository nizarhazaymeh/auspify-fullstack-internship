import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'token';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s === 'change-me') {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set in production');
  }
  return s || 'dev-only-insecure-secret';
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

export const verifyToken = (token) => jwt.verify(token, secret());

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: process.env.CROSS_SITE_COOKIES === 'true' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: process.env.CROSS_SITE_COOKIES === 'true' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

// Accepts the httpOnly cookie (browser) or an "Authorization: Bearer <token>" header (Postman/curl).
export async function requireAuth(req, res, next) {
  const header = req.get('authorization');
  const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ message: 'Please log in to continue' });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ message: 'Account no longer exists' });
  }
  req.user = user;
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  return next();
}

// Attaches req.user when a valid session exists, but never rejects the request.
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    req.user = await User.findById(verifyToken(token).sub);
  } catch {
    /* ignore invalid tokens on public routes */
  }
  return next();
}
