import { useState } from 'react'
import { api } from '../services/api.js'
import { useCarregar } from '../services/useCarregar.js'
import Campo from './Campo.jsx'
import Estado from './Estado.jsx'

const NOVA = { id: null, nome: '', tipo: 'saida' }

const GRUPOS = [
  { tipo: 'entrada', titulo: 'Entradas' },
  { tipo: 'saida', titulo: 'Saídas' },
]

export default function Categorias() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => api('/categorias'), [])
  const [form, setForm] = useState(NOVA)
  const [erros, setErros] = useState({})
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)

  const editando = form.id !== null

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  function editar(categoria) {
    setForm(categoria)
    setErros({})
  }

  function cancelar() {
    editar(NOVA)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setAviso('')
    if (!form.nome.trim()) {
      setErros({ nome: 'Informe o nome.' })
      return
    }
    setSalvando(true)
    try {
      const corpo = { nome: form.nome.trim(), tipo: form.tipo }
      if (editando) await api(`/categorias/${form.id}`, { metodo: 'PUT', corpo })
      else await api('/categorias', { metodo: 'POST', corpo })
      cancelar()
      recarregar()
    } catch (falha) {
      setErros(falha.campos)
      if (Object.keys(falha.campos).length === 0) setAviso(falha.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(categoria) {
    if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return
    setAviso('')
    try {
      await api(`/categorias/${categoria.id}`, { metodo: 'DELETE' })
      if (form.id === categoria.id) cancelar()
      recarregar()
    } catch (falha) {
      setAviso(falha.message) // ex.: 409, a categoria tem lançamentos
    }
  }

  return (
    <section>
      <h1>Categorias</h1>

      <form className="cartao formulario-linha" onSubmit={salvar} noValidate>
        <Campo
          id="nome"
          rotulo={editando ? 'Editar categoria' : 'Nova categoria'}
          placeholder="Ex.: Pets"
          value={form.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          erro={erros.nome}
        />
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <select id="tipo" value={form.tipo} onChange={(e) => alterar('tipo', e.target.value)}>
            <option value="saida">Saída</option>
            <option value="entrada">Entrada</option>
          </select>
        </Campo>
        <div className="acoes">
          <button className="botao" type="submit" disabled={salvando}>
            {editando ? 'Salvar' : 'Adicionar'}
          </button>
          {editando && (
            <button className="botao-secundario" type="button" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {aviso && (
        <p className="alerta" role="alert">
          {aviso}
        </p>
      )}

      <Estado
        carregando={carregando && !dados}
        erro={erro}
        aoTentarDeNovo={recarregar}
        vazio={dados?.length === 0}
        textoVazio="Nenhuma categoria cadastrada."
      >
        <div className="grade-2">
          {GRUPOS.map(({ tipo, titulo }) => (
            <div key={tipo} className="cartao">
              <h2>{titulo}</h2>
              <ul className="lista">
                {dados
                  ?.filter((categoria) => categoria.tipo === tipo)
                  .map((categoria) => (
                    <li key={categoria.id} className="lista-item">
                      <span>{categoria.nome}</span>
                      <span className="acoes">
                        <button className="botao-link" type="button" onClick={() => editar(categoria)}>
                          Editar
                        </button>
                        <button className="botao-link perigo" type="button" onClick={() => excluir(categoria)}>
                          Excluir
                        </button>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Estado>
    </section>
  )
}
