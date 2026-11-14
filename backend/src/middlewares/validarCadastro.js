import { ErroHttp } from './erros.js';
import {
  cpfValido,
  emailValido,
  senhaCabeNoBcrypt,
  senhaValida,
  somenteDigitos,
  texto,
} from '../models/validacao.js';

// Valida e normaliza o corpo do POST /api/auth/cadastro.
// Depois daqui, req.body tem email em minúsculas e cpf só com dígitos.
export function validarCadastro(req, res, next) {
  const corpo = req.body ?? {};
  const nome = texto(corpo.nome);
  const email = texto(corpo.email).toLowerCase();
  const cpf = somenteDigitos(texto(corpo.cpf));
  // A senha não passa por trim: espaço no começo ou no fim faz parte dela.
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
  const confirmacaoSenha = typeof corpo.confirmacaoSenha === 'string' ? corpo.confirmacaoSenha : '';

  const campos = {};

  if (!nome) campos.nome = 'Informe o nome.';
  else if (nome.length > 120) campos.nome = 'O nome deve ter no máximo 120 caracteres.';

  if (!email) campos.email = 'Informe o e-mail.';
  else if (!emailValido(email) || email.length > 160) campos.email = 'E-mail inválido.';

  if (!cpf) campos.cpf = 'Informe o CPF.';
  else if (!cpfValido(cpf)) campos.cpf = 'CPF inválido.';

  if (!senha) campos.senha = 'Informe a senha.';
  else if (!senhaValida(senha)) campos.senha = 'A senha deve ter no mínimo 8 caracteres, com letras e números.';
  else if (!senhaCabeNoBcrypt(senha)) campos.senha = 'A senha deve ter no máximo 72 caracteres.';

  if (!confirmacaoSenha) campos.confirmacaoSenha = 'Confirme a senha.';
  else if (confirmacaoSenha !== senha) campos.confirmacaoSenha = 'As senhas não conferem.';

  if (Object.keys(campos).length > 0) {
    throw new ErroHttp(400, 'Dados inválidos.', campos);
  }

  req.body = { nome, email, cpf, senha };
  next();
}
