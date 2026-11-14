// Único ponto de comunicação com a API. Todas as telas chamam api(...).
// - põe o cabeçalho Authorization com o token salvo;
// - transforma erro HTTP em ErroApi { status, message, campos };
// - em 401 de uma requisição autenticada, avisa o AuthContext para fazer logout.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const CHAVE_TOKEN = 'financas.token'

export class ErroApi extends Error {
  constructor(status, mensagem, campos = {}) {
    super(mensagem)
    this.status = status
    this.campos = campos
  }
}

// localStorage pode lançar exceção (modo privado, armazenamento bloqueado).
export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token)
  } catch {
    // sem armazenamento: a sessão dura só até recarregar a página
  }
}

export function apagarToken() {
  try {
    localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // nada a fazer
  }
}

let aoNaoAutorizado = () => {}

// O AuthContext registra aqui o que fazer quando o token expira.
export function definirAoNaoAutorizado(fn) {
  aoNaoAutorizado = fn
}

// caminho: '/lancamentos'; opções: { metodo, corpo, params }
export async function api(caminho, { metodo = 'GET', corpo, params } = {}) {
  const url = new URL(BASE + caminho)
  for (const [nome, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(nome, valor)
  }

  const token = lerToken()
  const headers = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar à API. Verifique se o back-end está rodando.')
  }

  if (resposta.status === 204) return null
  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    // 401 no login é só senha errada; 401 com token salvo é sessão expirada.
    if (resposta.status === 401 && token) aoNaoAutorizado()
    throw new ErroApi(resposta.status, dados?.erro ?? 'Erro inesperado.', dados?.campos ?? {})
  }
  return dados
}
