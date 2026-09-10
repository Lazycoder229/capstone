import rateLimit from 'express-rate-limit';

// General limiter — applied sa lahat ng /api routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Mas mahigpit — para sa login/register (protection laban sa brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
  skipSuccessfulRequests: true, // hindi mabibilang ang successful logins, failed attempts lang
});

// Mas relaxed — para sa mga endpoints na mataas ang expected traffic (halimbawa QR ordering)
export const looseLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});