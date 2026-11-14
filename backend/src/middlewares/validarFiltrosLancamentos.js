import { ErroHttp } from './erros.js';
import { idValido, inteiroEntre } from '../models/validacao.js';
import { TIPOS_LANCAMENTO } from './validarLancamento.js';

// Filtros da listagem (além do período, lido pelo validarPeriodo):
// ?tipo=&categoriaId=&fonteDestinoId=&pagina=&porPagina=
// Deixa o resultado em req.filtros.
export function validarFiltrosLancamentos(req, res, next) {
  const { tipo, categoriaId, fonteDestinoId, pagina = '1', porPagina = '20' } = req.query;

  const filtros = {
    tipo: tipo || null,
    categoriaId: categoriaId ? Number(categoriaId) : null,
    fonteDestinoId: fonteDestinoId ? Number(fonteDestinoId) : null,
    pagina: Number(pagina),
    porPagina: Number(porPagina),
  };

  const campos = {};
  if (filtros.tipo && !TIPOS_LANCAMENTO.includes(filtros.tipo)) {
    campos.tipo = 'O tipo deve ser entrada ou saida.';
  }
  if (filtros.categoriaId !== null && !idValido(filtros.categoriaId)) {
    campos.categoriaId = 'Categoria inválida.';
  }
  if (filtros.fonteDestinoId !== null && !idValido(filtros.fonteDestinoId)) {
    campos.fonteDestinoId = 'Fonte/destino inválida.';
  }
  if (!inteiroEntre(filtros.pagina, 1, 100000)) campos.pagina = 'Página inválida.';
  if (!inteiroEntre(filtros.porPagina, 1, 100)) campos.porPagina = 'Use de 1 a 100 itens por página.';

  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Filtros inválidos.', campos);
  }

  req.filtros = filtros;
  next();
}
