import { useCallback, useEffect, useState } from 'react'

// Carrega dados da API e controla os estados de carregando e erro.
// carregar: função que devolve uma Promise (ex.: () => api('/categorias'))
// dependencias: quando alguma muda, carrega de novo (ex.: o filtro de período)
// Durante um recarregamento os dados antigos continuam na tela.
export function useCarregar(carregar, dependencias) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true // ignora a resposta se o componente saiu da tela ou o filtro mudou
    setCarregando(true)
    setErro(null)
    carregar()
      .then((resposta) => ativo && setDados(resposta))
      .catch((falha) => ativo && setErro(falha))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- as dependências vêm de quem chama
  }, [...dependencias, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  return { dados, carregando, erro, recarregar }
}
