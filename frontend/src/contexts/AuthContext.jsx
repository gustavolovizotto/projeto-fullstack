import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, apagarToken, definirAoNaoAutorizado, lerToken, salvarToken } from '../services/api.js'

const AuthContext = createContext(null)

// Guarda quem está logado e o token. O token fica no localStorage para
// sobreviver ao recarregamento da página.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => lerToken())
  const [usuario, setUsuario] = useState(null)
  // Com token salvo, conferimos no /me se ele ainda vale antes de mostrar as telas.
  const [validando, setValidando] = useState(() => Boolean(lerToken()))
  const navigate = useNavigate()

  const logout = useCallback(() => {
    apagarToken()
    setToken(null)
    setUsuario(null)
  }, [])

  // Qualquer 401 com token (sessão expirada) desloga e volta para o login.
  useEffect(() => {
    definirAoNaoAutorizado(() => {
      logout()
      // Depois de entrar de novo, volta para a tela em que o usuário estava.
      navigate('/login', { replace: true, state: { expirou: true, de: window.location.pathname } })
    })
  }, [logout, navigate])

  // Só na abertura do app: valida o token salvo e carrega o usuário.
  useEffect(() => {
    if (!lerToken()) return
    api('/auth/me')
      .then(setUsuario)
      .catch(() => {}) // 401 já desloga pelo api.js; sem rede, mantém o token
      .finally(() => setValidando(false))
  }, [])

  const login = useCallback(async (email, senha) => {
    const resposta = await api('/auth/login', { metodo: 'POST', corpo: { email, senha } })
    salvarToken(resposta.token)
    setToken(resposta.token)
    setUsuario(resposta.usuario)
  }, [])

  const cadastrar = useCallback(
    async (dados) => {
      await api('/auth/cadastro', { metodo: 'POST', corpo: dados })
      await login(dados.email, dados.senha)
    },
    [login],
  )

  const valor = { usuario, token, autenticado: Boolean(token), validando, login, logout, cadastrar }
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook do próprio contexto
export function useAuth() {
  return useContext(AuthContext)
}
