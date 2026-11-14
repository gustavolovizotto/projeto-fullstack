import { Router } from 'express';
import * as Categoria from '../models/Categoria.js';
import * as FonteDestino from '../models/FonteDestino.js';
import * as Lancamento from '../models/Lancamento.js';
import { cabeEmParcelas } from '../models/parcelas.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarId } from '../middlewares/validarId.js';
import { validarLancamento } from '../middlewares/validarLancamento.js';
import { validarPeriodo } from '../middlewares/validarPeriodo.js';
import { validarFiltrosLancamentos } from '../middlewares/validarFiltrosLancamentos.js';

// Montado em /api/lancamentos, depois do middleware autenticar.
const router = Router();
router.param('id', validarId);

const NOME_TIPO = { entrada: 'entrada', saida: 'saída' };

// Regras que dependem do banco, iguais na criação e na edição:
// a categoria e a fonte/destino precisam ser do usuário (senão, 404), a
// categoria precisa ser do mesmo tipo do lançamento e só compra no cartão
// pode ser parcelada.
async function conferirReferencias(usuarioId, { tipo, categoriaId, fonteDestinoId }, totalParcelas) {
  const categoria = await Categoria.buscar(categoriaId, usuarioId);
  if (!categoria) {
    throw new ErroHttp(404, 'Categoria não encontrada.', { categoriaId: 'Categoria não encontrada.' });
  }
  const fonteDestino = await FonteDestino.buscar(fonteDestinoId, usuarioId);
  if (!fonteDestino) {
    throw new ErroHttp(404, 'Fonte/destino não encontrada.', {
      fonteDestinoId: 'Fonte/destino não encontrada.',
    });
  }
  if (categoria.tipo !== tipo) {
    throw new ErroHttp(400, 'Dados inválidos.', {
      categoriaId: `A categoria informada é de ${NOME_TIPO[categoria.tipo]}, mas o lançamento é de ${NOME_TIPO[tipo]}.`,
    });
  }
  if (totalParcelas > 1 && (tipo !== 'saida' || fonteDestino.tipo !== 'cartao_credito')) {
    throw new ErroHttp(400, 'Dados inválidos.', {
      totalParcelas: 'Só compras (saídas) no cartão de crédito podem ser parceladas.',
    });
  }
}

// ?inicio=&fim= (padrão: mês corrente) &tipo=&categoriaId=&fonteDestinoId=&pagina=&porPagina=
router.get('/', validarPeriodo, validarFiltrosLancamentos, async (req, res) => {
  const resultado = await Lancamento.listar(req.usuarioId, req.periodo, req.filtros);
  res.json({ periodo: req.periodo, ...resultado });
});

router.post('/', validarLancamento, async (req, res) => {
  await conferirReferencias(req.usuarioId, req.body, req.body.totalParcelas);
  res.status(201).json(await Lancamento.criar(req.usuarioId, req.body));
});

router.get('/:id', async (req, res) => {
  const lancamento = await Lancamento.buscar(req.id, req.usuarioId);
  if (!lancamento) throw new ErroHttp(404, 'Lançamento não encontrado.');
  res.json(lancamento);
});

// Três formas de editar:
// - lançamento sem parcelas: muda tudo;
// - uma parcela só: muda descrição, valor e categoria. Data, cartão e tipo
//   definem em que fatura cada parcela cai, então só mudam editando todas;
// - ?todasParcelas=true: muda descrição, categoria, data, cartão e o valor
//   total da compra, redividido entre as parcelas.
// O número de parcelas não muda na edição (o totalParcelas do corpo é ignorado).
router.put('/:id', validarLancamento, async (req, res) => {
  const atual = await Lancamento.buscar(req.id, req.usuarioId);
  if (!atual) throw new ErroHttp(404, 'Lançamento não encontrado.');
  const dados = req.body;

  if (atual.totalParcelas === 1) {
    await conferirReferencias(req.usuarioId, dados, 1);
    return res.json(await Lancamento.atualizar(req.id, req.usuarioId, dados));
  }

  if (req.query.todasParcelas !== 'true') {
    const travados = {};
    const mensagem = 'Para mudar este campo, edite todas as parcelas.';
    if (dados.tipo !== atual.tipo) travados.tipo = mensagem;
    if (dados.data !== atual.data) travados.data = mensagem;
    if (dados.fonteDestinoId !== atual.fonteDestinoId) travados.fonteDestinoId = mensagem;
    if (Object.keys(travados).length > 0) throw new ErroHttp(400, 'Dados inválidos.', travados);

    await conferirReferencias(req.usuarioId, dados, 1);
    return res.json(await Lancamento.atualizar(req.id, req.usuarioId, dados));
  }

  if (dados.tipo !== 'saida') {
    throw new ErroHttp(400, 'Dados inválidos.', { tipo: 'Uma compra parcelada é sempre uma saída.' });
  }
  await conferirReferencias(req.usuarioId, dados, atual.totalParcelas);
  const parcelas = await Lancamento.contarParcelasAtivas(atual.grupoParcelamento, req.usuarioId);
  if (!cabeEmParcelas(dados.valor, parcelas)) {
    throw new ErroHttp(400, 'Dados inválidos.', {
      valor: 'O valor é pequeno demais para esse número de parcelas.',
    });
  }
  return res.json(await Lancamento.atualizarGrupo(atual.grupoParcelamento, req.usuarioId, dados));
});

// ?todasParcelas=true exclui todas as parcelas da mesma compra.
router.delete('/:id', async (req, res) => {
  const excluidos = await Lancamento.excluir(req.id, req.usuarioId, req.query.todasParcelas === 'true');
  if (excluidos === 0) throw new ErroHttp(404, 'Lançamento não encontrado.');
  res.status(204).end();
});

export default router;
