import { rateLimit } from 'express-rate-limit';

// Contra tentativa de adivinhar senha: no máximo 5 logins com falha por IP a
// cada 15 minutos. Login que deu certo não conta (skipSuccessfulRequests).
export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente de novo em alguns minutos.' },
});
