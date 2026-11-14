import { Router } from 'express';
import bcrypt from 'bcrypt';
import * as Usuario from '../models/Usuario.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarCadastro } from '../middlewares/validarCadastro.js';

const router = Router();

// Constraint violada → campo que o front deve destacar.
const CAMPO_DUPLICADO = {
  usuarios_email_unico: { campo: 'email', mensagem: 'Já existe um usuário com este e-mail.' },
  usuarios_cpf_unico: { campo: 'cpf', mensagem: 'Já existe um usuário com este CPF.' },
};

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

export default router;
