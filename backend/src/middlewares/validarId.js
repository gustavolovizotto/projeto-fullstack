import { ErroHttp } from './erros.js';
import { idValido } from '../models/validacao.js';

// Usado com router.param('id', validarId). Garante que o :id da URL é um
// inteiro positivo que cabe num INTEGER do PostgreSQL antes de chegar ao
// banco. Qualquer outra coisa vira 404: esse registro não existe.
export function validarId(req, res, next, valor) {
  const id = Number(valor);
  if (!idValido(id)) {
    return next(new ErroHttp(404, 'Registro não encontrado.'));
  }
  req.id = id;
  return next();
}
