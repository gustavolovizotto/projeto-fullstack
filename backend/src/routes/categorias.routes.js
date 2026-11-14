import { Router } from 'express';
import * as Categoria from '../models/Categoria.js';
import { ErroHttp, violouUnico } from '../middlewares/erros.js';
import { validarId } from '../middlewares/validarId.js';
import { TIPOS_CATEGORIA, validarCategoria } from '../middlewares/validarCategoria.js';

// Montado em /api/categorias, depois do middleware autenticar.
const router = Router();
router.param('id', validarId);

function nomeDuplicado(tipo) {
  const rotulo = tipo === 'entrada' ? 'entrada' : 'saída';
  return new ErroHttp(409, 'Categoria já existe.', {
    nome: `Já existe uma categoria de ${rotulo} com esse nome.`,
  });
}

router.get('/', async (req, res) => {
  const { tipo } = req.query;
  if (tipo !== undefined && !TIPOS_CATEGORIA.includes(tipo)) {
    throw new ErroHttp(400, 'Dados inválidos.', { tipo: 'O tipo deve ser entrada ou saida.' });
  }
  res.json(await Categoria.listar(req.usuarioId, tipo));
});

router.post('/', validarCategoria, async (req, res) => {
  try {
    const categoria = await Categoria.criar(req.usuarioId, req.body);
    res.status(201).json(categoria);
  } catch (erro) {
    if (violouUnico(erro, 'categorias_nome_unico')) throw nomeDuplicado(req.body.tipo);
    throw erro;
  }
});

router.put('/:id', validarCategoria, async (req, res) => {
  let categoria;
  try {
    categoria = await Categoria.atualizar(req.id, req.usuarioId, req.body);
  } catch (erro) {
    if (violouUnico(erro, 'categorias_nome_unico')) throw nomeDuplicado(req.body.tipo);
    throw erro;
  }
  if (categoria) return res.json(categoria);

  // Não atualizou: ou não existe para este usuário, ou o tipo não pode mudar.
  if (!(await Categoria.buscar(req.id, req.usuarioId))) {
    throw new ErroHttp(404, 'Categoria não encontrada.');
  }
  throw new ErroHttp(409, 'Não é possível mudar o tipo de uma categoria que tem lançamentos.', {
    tipo: 'Esta categoria tem lançamentos. Mova-os para outra categoria antes de mudar o tipo.',
  });
});

router.delete('/:id', async (req, res) => {
  if (await Categoria.excluir(req.id, req.usuarioId)) return res.status(204).end();

  // Não excluiu: ou não existe para este usuário, ou ainda tem lançamentos.
  if (!(await Categoria.buscar(req.id, req.usuarioId))) {
    throw new ErroHttp(404, 'Categoria não encontrada.');
  }
  throw new ErroHttp(
    409,
    'Não é possível excluir uma categoria que tem lançamentos. Exclua ou mova os lançamentos antes.',
  );
});

export default router;
