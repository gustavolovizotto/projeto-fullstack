import { Router } from 'express';
import * as FonteDestino from '../models/FonteDestino.js';
import { ErroHttp, violouUnico } from '../middlewares/erros.js';
import { validarId } from '../middlewares/validarId.js';
import {
  TIPOS_FONTE_DESTINO,
  validarFonteDestino,
} from '../middlewares/validarFonteDestino.js';

// Montado em /api/fontes-destinos, depois do middleware autenticar.
const router = Router();
router.param('id', validarId);

const NOME_DUPLICADO = new ErroHttp(409, 'Fonte/destino já existe.', {
  nome: 'Já existe uma fonte/destino com esse nome.',
});

router.get('/', async (req, res) => {
  const { tipo } = req.query;
  if (tipo !== undefined && !TIPOS_FONTE_DESTINO.includes(tipo)) {
    throw new ErroHttp(400, 'Dados inválidos.', {
      tipo: 'O tipo deve ser renda, conta ou cartao_credito.',
    });
  }
  res.json(await FonteDestino.listar(req.usuarioId, tipo));
});

router.post('/', validarFonteDestino, async (req, res) => {
  try {
    res.status(201).json(await FonteDestino.criar(req.usuarioId, req.body));
  } catch (erro) {
    if (violouUnico(erro, 'fontes_destinos_nome_unico')) throw NOME_DUPLICADO;
    throw erro;
  }
});

router.put('/:id', validarFonteDestino, async (req, res) => {
  let fonteDestino;
  try {
    fonteDestino = await FonteDestino.atualizar(req.id, req.usuarioId, req.body);
  } catch (erro) {
    if (violouUnico(erro, 'fontes_destinos_nome_unico')) throw NOME_DUPLICADO;
    throw erro;
  }
  if (fonteDestino) return res.json(fonteDestino);

  // Não atualizou: ou não existe para este usuário, ou o tipo não pode mudar.
  if (!(await FonteDestino.buscar(req.id, req.usuarioId))) {
    throw new ErroHttp(404, 'Fonte/destino não encontrada.');
  }
  throw new ErroHttp(409, 'Não é possível mudar o tipo de uma fonte/destino que tem lançamentos.', {
    tipo: 'Esta fonte/destino tem lançamentos. Não é possível mudar o tipo.',
  });
});

router.delete('/:id', async (req, res) => {
  if (await FonteDestino.excluir(req.id, req.usuarioId)) return res.status(204).end();

  if (!(await FonteDestino.buscar(req.id, req.usuarioId))) {
    throw new ErroHttp(404, 'Fonte/destino não encontrada.');
  }
  throw new ErroHttp(
    409,
    'Não é possível excluir uma fonte/destino que tem lançamentos. Exclua ou mova os lançamentos antes.',
  );
});

export default router;
