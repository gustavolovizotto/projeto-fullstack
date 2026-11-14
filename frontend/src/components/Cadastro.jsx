import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { mascaraCpf } from '../services/formatos.js'
import { cpfValido, emailValido, senhaValida } from '../services/validacao.js'
import Campo from './Campo.jsx'

const VAZIO = { nome: '', email: '', cpf: '', senha: '', confirmacaoSenha: '' }

function validar(dados) {
  const erros = {}
  if (!dados.nome.trim()) erros.nome = 'Informe o nome.'
  if (!dados.email.trim()) erros.email = 'Informe o e-mail.'
  else if (!emailValido(dados.email.trim())) erros.email = 'E-mail inválido.'
  if (!dados.cpf) erros.cpf = 'Informe o CPF.'
  else if (!cpfValido(dados.cpf)) erros.cpf = 'CPF inválido.'
  if (!dados.senha) erros.senha = 'Informe a senha.'
  else if (!senhaValida(dados.senha)) erros.senha = 'A senha deve ter no mínimo 8 caracteres, com letras e números.'
  if (!dados.confirmacaoSenha) erros.confirmacaoSenha = 'Confirme a senha.'
  else if (dados.confirmacaoSenha !== dados.senha) erros.confirmacaoSenha = 'As senhas não conferem.'
  return erros
}

export default function Cadastro() {
  const { autenticado, cadastrar } = useAuth()
  const [dados, setDados] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Depois do cadastro o AuthContext já faz o login, e esta tela redireciona.
  if (autenticado) return <Navigate to="/" replace />

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
    // Some com o erro do campo assim que o usuário mexe nele.
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const novosErros = validar(dados)
    setErros(novosErros)
    setMensagem('')
    if (Object.keys(novosErros).length > 0) return

    setEnviando(true)
    try {
      await cadastrar({ ...dados, nome: dados.nome.trim(), email: dados.email.trim() })
    } catch (erro) {
      // 409 de e-mail ou CPF repetido chega em erro.campos e aparece no campo certo.
      setErros(erro.campos ?? {})
      setMensagem(erro.message)
      setEnviando(false)
    }
  }

  return (
    <div className="pagina-auth">
      <form className="cartao formulario" onSubmit={enviar} noValidate>
        <h1>Criar conta</h1>
        {mensagem && (
          <p className="alerta" role="alert">
            {mensagem}
          </p>
        )}
        <Campo
          id="nome"
          rotulo="Nome"
          autoComplete="name"
          value={dados.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          erro={erros.nome}
        />
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          value={dados.email}
          onChange={(e) => alterar('email', e.target.value)}
          erro={erros.email}
        />
        <Campo
          id="cpf"
          rotulo="CPF"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={dados.cpf}
          onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
          erro={erros.cpf}
        />
        <Campo
          id="senha"
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          value={dados.senha}
          onChange={(e) => alterar('senha', e.target.value)}
          erro={erros.senha}
        />
        <Campo
          id="confirmacaoSenha"
          rotulo="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={dados.confirmacaoSenha}
          onChange={(e) => alterar('confirmacaoSenha', e.target.value)}
          erro={erros.confirmacaoSenha}
        />
        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
        <p className="texto-suave">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
