import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Campo from './Campo.jsx'

export default function Login() {
  const { autenticado, login } = useAuth()
  const local = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Logado (inclusive logo depois do login dar certo): volta para a tela de
  // onde o usuário veio, ou para o resumo.
  if (autenticado) return <Navigate to={local.state?.de ?? '/'} replace />

  async function entrar(evento) {
    evento.preventDefault()
    const novosErros = {}
    if (!email.trim()) novosErros.email = 'Informe o e-mail.'
    if (!senha) novosErros.senha = 'Informe a senha.'
    setErros(novosErros)
    setMensagem('')
    if (Object.keys(novosErros).length > 0) return

    setEnviando(true)
    try {
      await login(email.trim(), senha)
    } catch (erro) {
      setErros(erro.campos ?? {})
      setMensagem(erro.message)
      setEnviando(false)
    }
  }

  return (
    <div className="pagina-auth">
      <form className="cartao formulario" onSubmit={entrar} noValidate>
        <h1>Entrar</h1>
        {local.state?.expirou && !mensagem && (
          <p className="alerta alerta-info">Sua sessão expirou. Entre novamente.</p>
        )}
        {mensagem && (
          <p className="alerta" role="alert">
            {mensagem}
          </p>
        )}
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
        />
        <Campo
          id="senha"
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />
        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="texto-suave">
          Não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </div>
  )
}
