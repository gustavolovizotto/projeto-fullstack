import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as Usuario from '../models/Usuario.js';
import { ErroHttp } from '../middlewares/erros.js';
import { autenticar } from '../middlewares/autenticar.js';
import { limitarLogin } from '../middlewares/limitarLogin.js';
import { validarCadastro } from '../middlewares/validarCadastro.js';
import { validarLogin } from '../middlewares/validarLogin.js';

const router = Router();

// Constraint violada → campo que o front deve destacar.
const CAMPO_DUPLICADO = {
  usuarios_email_unico: { campo: 'email', mensagem: 'Já existe um usuário com este e-mail.' },
  usuarios_cpf_unico: { campo: 'cpf', mensagem: 'Já existe um usuário com este CPF.' },
};

// Hash usado quando o e-mail não existe, para o login levar o mesmo tempo nos
// dois casos e o tempo de resposta não revelar quais e-mails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync('senha-que-nao-existe', 10);

router.post('/cadastro', validarCadastro, async (req, res) => {
  const { nome, email, cpf, senha } = req.body;
  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const usuario = await Usuario.cadastrar({ nome, email, cpf, senhaHash });
    return res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
  } catch (erro) {
    // Não existe consulta prévia "esse e-mail já existe?": quem garante a
    // unicidade é o UNIQUE do banco, sem risco de condição de corrida.
    const duplicado = erro.code === '23505' && CAMPO_DUPLICADO[erro.constraint];
    if (duplicado) {
      throw new ErroHttp(409, 'Usuário já cadastrado.', { [duplicado.campo]: duplicado.mensagem });
    }
    throw erro;
  }
});

router.post('/login', limitarLogin, validarLogin, async (req, res) => {
  const { email, senha } = req.body;
  const usuario = await Usuario.buscarComSenhaPorEmail(email);

  const senhaConfere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);
  if (!usuario || !senhaConfere) {
    // Mesma mensagem para e-mail inexistente e senha errada.
    throw new ErroHttp(401, 'E-mail ou senha inválidos.');
  }

  const token = jwt.sign({ sub: String(usuario.id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  });
  return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
});

router.get('/me', autenticar, async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.usuarioId);
  if (!usuario) {
    // Token válido de um usuário que não existe mais (ex.: banco recriado).
    throw new ErroHttp(401, 'Usuário não encontrado.');
  }
  return res.json(usuario);
});

export default router;
