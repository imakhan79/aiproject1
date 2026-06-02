import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});
