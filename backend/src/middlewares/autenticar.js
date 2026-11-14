import jwt from 'jsonwebtoken';

// Exige o cabeçalho Authorization: Bearer <token>. Se o token for válido,
// deixa o id do dono em req.usuarioId. Toda rota protegida filtra por ele.
export function autenticar(req, res, next) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.usuarioId = Number(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}
