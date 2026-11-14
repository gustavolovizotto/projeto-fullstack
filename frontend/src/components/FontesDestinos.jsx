import { useState } from 'react'
import { api } from '../services/api.js'
import { lerMoeda, mascaraMoeda, moeda, moedaParaCampo } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Campo from './Campo.jsx'
import Estado from './Estado.jsx'

const NOVA = { id: null, nome: '', tipo: 'conta', diaFechamento: '', diaVencimento: '', limite: '' }

const GRUPOS = [
  { tipo: 'conta', titulo: 'Contas' },
  { tipo: 'renda', titulo: 'Rendas' },
  { tipo: 'cartao_credito', titulo: 'Cartões de crédito' },
]

function validar(form) {
  const erros = {}
  if (!form.nome.trim()) erros.nome = 'Informe o nome.'
  if (form.tipo === 'cartao_credito') {
    const dia = (valor) => Number.isInteger(Number(valor)) && Number(valor) >= 1 && Number(valor) <= 31
    if (!dia(form.diaFechamento)) erros.diaFechamento = 'Dia de 1 a 31.'
    if (!dia(form.diaVencimento)) erros.diaVencimento = 'Dia de 1 a 31.'
    if (!(lerMoeda(form.limite) > 0)) erros.limite = 'Informe o limite.'
  }
  return erros
}

export default function FontesDestinos() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => api('/fontes-destinos'), [])
  const [form, setForm] = useState(NOVA)
  const [erros, setErros] = useState({})
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)

  const editando = form.id !== null
  const ehCartao = form.tipo === 'cartao_credito'

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  // Passa o registro da API para o formato do formulário (tudo texto).
  function editar(item) {
    setForm({
      ...item,
      diaFechamento: item.diaFechamento ?? '',
      diaVencimento: item.diaVencimento ?? '',
      limite: moedaParaCampo(item.limite),
    })
    setErros({})
  }

  function cancelar() {
    setForm(NOVA)
    setErros({})
  }

  async function salvar(evento) {
    evento.preventDefault()
    setAviso('')
    const novosErros = validar(form)
    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    const corpo = { nome: form.nome.trim(), tipo: form.tipo }
    if (ehCartao) {
      corpo.diaFechamento = Number(form.diaFechamento)
      corpo.diaVencimento = Number(form.diaVencimento)
      corpo.limite = lerMoeda(form.limite)
    }

    setSalvando(true)
    try {
      if (editando) await api(`/fontes-destinos/${form.id}`, { metodo: 'PUT', corpo })
      else await api('/fontes-destinos', { metodo: 'POST', corpo })
      cancelar()
      recarregar()
    } catch (falha) {
      setErros(falha.campos)
      if (Object.keys(falha.campos).length === 0) setAviso(falha.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(item) {
    if (!window.confirm(`Excluir "${item.nome}"?`)) return
    setAviso('')
    try {
      await api(`/fontes-destinos/${item.id}`, { metodo: 'DELETE' })
      if (form.id === item.id) cancelar()
      recarregar()
    } catch (falha) {
      setAviso(falha.message)
    }
  }

  return (
    <section>
      <h1>Fontes e destinos</h1>
      <p className="texto-suave">
        De onde o dinheiro vem (salário, freelas) e para onde vai (conta, poupança, cartões).
      </p>

      <form className="cartao formulario-linha" onSubmit={salvar} noValidate>
        <Campo
          id="nome"
          rotulo={editando ? 'Editar' : 'Nova fonte/destino'}
          placeholder="Ex.: Nubank"
          value={form.nome}
          onChange={(e) => alterar('nome', e.target.value)}
          erro={erros.nome}
        />
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <select id="tipo" value={form.tipo} onChange={(e) => alterar('tipo', e.target.value)}>
            <option value="conta">Conta</option>
            <option value="renda">Renda</option>
            <option value="cartao_credito">Cartão de crédito</option>
          </select>
        </Campo>
        {ehCartao && (
          <>
            <Campo
              id="diaFechamento"
              rotulo="Dia do fechamento"
              type="number"
              min="1"
              max="31"
              value={form.diaFechamento}
              onChange={(e) => alterar('diaFechamento', e.target.value)}
              erro={erros.diaFechamento}
            />
            <Campo
              id="diaVencimento"
              rotulo="Dia do vencimento"
              type="number"
              min="1"
              max="31"
              value={form.diaVencimento}
              onChange={(e) => alterar('diaVencimento', e.target.value)}
              erro={erros.diaVencimento}
            />
            <Campo
              id="limite"
              rotulo="Limite (R$)"
              inputMode="numeric"
              placeholder="0,00"
              value={form.limite}
              onChange={(e) => alterar('limite', mascaraMoeda(e.target.value))}
              erro={erros.limite}
            />
          </>
        )}
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
        textoVazio="Nenhuma fonte ou destino cadastrado."
      >
        <div className="grade-2">
          {GRUPOS.map(({ tipo, titulo }) => {
            const itens = dados?.filter((item) => item.tipo === tipo) ?? []
            return (
              <div key={tipo} className="cartao">
                <h2>{titulo}</h2>
                {itens.length === 0 && <p className="texto-suave">Nenhum cadastrado.</p>}
                <ul className="lista">
                  {itens.map((item) => (
                    <li key={item.id} className="lista-item">
                      <span>
                        {item.nome}
                        {tipo === 'cartao_credito' && (
                          <small className="texto-suave detalhe">
                            Fecha dia {item.diaFechamento} · vence dia {item.diaVencimento} · limite{' '}
                            {moeda(item.limite)}
                          </small>
                        )}
                      </span>
                      <span className="acoes">
                        <button className="botao-link" type="button" onClick={() => editar(item)}>
                          Editar
                        </button>
                        <button className="botao-link perigo" type="button" onClick={() => excluir(item)}>
                          Excluir
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </Estado>
    </section>
  )
}
