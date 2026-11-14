import { ErroHttp } from './erros.js';

// Usado com router.param('id', validarId). Garante que o :id da URL é um
// inteiro positivo (o maior que cabe num INTEGER do PostgreSQL) antes de
// chegar ao banco. Qualquer outra coisa vira 404: esse registro não existe.
export function validarId(req, res, next, valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    return next(new ErroHttp(404, 'Registro não encontrado.'));
  }
  req.id = id;
  return next();
}
